import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)


@shared_task(name='notifications.tasks.check_anomalies')
def check_anomalies():
    _check_inactive_users()
    _check_high_volume()
    logger.info('Anomaly check completed.')


def _check_inactive_users():
    from users.models import User
    from .models import Notification

    cutoff = timezone.now() - timedelta(days=30)
    inactive_users = User.objects.filter(
        role='user',
        is_active=True,
        deleted_at__isnull=True,
        last_login__lt=cutoff,
        last_login__isnull=False,
    )
    for user in inactive_users:
        Notification.objects.get_or_create(
            type='user_inactive',
            reference_id=user.id,
            is_read=False,
            defaults={'metadata': {'email': user.email, 'last_login': str(user.last_login)}},
        )


def _check_high_volume():
    from transactions.models import Transaction
    from .models import Notification
    from django.db.models import Avg, Sum

    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    from users.models import User
    for user in User.objects.filter(role='user', is_active=True):
        monthly_volume = (
            Transaction.objects
            .filter(user=user, status='succeeded', created_at__gte=month_start)
            .aggregate(total=Sum('amount'))['total'] or 0
        )

        avg_monthly = (
            Transaction.objects
            .filter(user=user, status='succeeded')
            .aggregate(avg=Avg('amount'))['avg'] or 0
        )

        if avg_monthly > 0 and monthly_volume > avg_monthly * 5:
            Notification.objects.get_or_create(
                type='high_volume_tx',
                reference_id=user.id,
                is_read=False,
                defaults={'metadata': {
                    'email': user.email,
                    'monthly_volume_cents': monthly_volume,
                    'avg_cents': int(avg_monthly),
                }},
            )
