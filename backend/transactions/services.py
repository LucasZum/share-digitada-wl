from django.utils import timezone
from django.db.models import Sum, Count, Avg, Q
from datetime import timedelta


def _period_start(period: str):
    now = timezone.now()
    if period == 'today':
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    if period == '7d':
        return now - timedelta(days=7)
    return now - timedelta(days=30)  # default 30d


class TransactionMetricsService:
    @staticmethod
    def get_global_metrics(period: str = '30d') -> dict:
        from .models import Transaction
        from django.core.cache import cache

        cache_key = f'metrics:global:{period}'
        cached = cache.get(cache_key)
        if cached:
            return cached

        start = _period_start(period)
        qs = Transaction.objects.filter(created_at__gte=start)
        total = qs.aggregate(
            volume=Sum('amount', filter=Q(status='succeeded')),
            count=Count('id', filter=Q(status='succeeded')),
            total_count=Count('id'),
        )
        volume = total['volume'] or 0
        count = total['count'] or 0
        total_count = total['total_count'] or 0
        avg_ticket = (volume // count) if count > 0 else 0
        approval_rate = round((count / total_count * 100), 1) if total_count > 0 else 0.0

        from users.models import User
        active_users = User.objects.filter(is_active=True, deleted_at__isnull=True, role='user').count()

        result = {
            'volume_cents': volume,
            'transaction_count': count,
            'avg_ticket_cents': avg_ticket,
            'approval_rate': approval_rate,
            'active_users': active_users,
            'period': period,
        }
        cache.set(cache_key, result, timeout=60)
        return result

    @staticmethod
    def get_chart_data(period: str = '30d') -> list:
        from .models import Transaction
        from django.db.models.functions import TruncDate

        start = _period_start(period)
        data = (
            Transaction.objects
            .filter(created_at__gte=start, status='succeeded')
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(volume=Sum('amount'), count=Count('id'))
            .order_by('date')
        )
        return [
            {'date': str(d['date']), 'volume_cents': d['volume'], 'count': d['count']}
            for d in data
        ]

    @staticmethod
    def get_user_metrics(user_id, period: str = '30d') -> dict:
        from .models import Transaction
        from django.db.models import Sum, Count, Q

        start = _period_start(period)
        qs = Transaction.objects.filter(user_id=user_id, created_at__gte=start)
        agg = qs.aggregate(
            volume=Sum('amount', filter=Q(status='succeeded')),
            count=Count('id', filter=Q(status='succeeded')),
            total=Count('id'),
        )
        volume = agg['volume'] or 0
        count = agg['count'] or 0
        total = agg['total'] or 0
        avg_ticket = (volume // count) if count > 0 else 0
        fee_cents = int(volume * 0.05)

        return {
            'volume_cents': volume,
            'transaction_count': count,
            'avg_ticket_cents': avg_ticket,
            'approval_rate': round(count / total * 100, 1) if total > 0 else 0.0,
            'fee_cents': fee_cents,
            'period': period,
        }

    @staticmethod
    def get_billing_report(year: int, month: int) -> list:
        from .models import Transaction
        from users.models import User
        from django.db.models import Sum, Count, Q

        start = timezone.datetime(year, month, 1, tzinfo=timezone.utc)
        if month == 12:
            end = timezone.datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        else:
            end = timezone.datetime(year, month + 1, 1, tzinfo=timezone.utc)

        users = User.objects.filter(role='user', deleted_at__isnull=True)
        result = []
        for user in users:
            agg = Transaction.objects.filter(
                user=user,
                status='succeeded',
                created_at__gte=start,
                created_at__lt=end,
            ).aggregate(volume=Sum('amount'), count=Count('id'))
            volume = agg['volume'] or 0
            count = agg['count'] or 0
            result.append({
                'user_id': str(user.id),
                'email': user.email,
                'full_name': user.full_name,
                'volume_cents': volume,
                'transaction_count': count,
                'fee_cents': int(volume * 0.05),
            })
        return result
