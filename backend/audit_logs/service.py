import logging
from typing import Optional

logger = logging.getLogger(__name__)


class AuditLogService:
    @staticmethod
    def log(
        action: str,
        actor=None,
        target_type: str = '',
        target_id: Optional[str] = None,
        metadata: Optional[dict] = None,
        request=None,
    ):
        try:
            from .models import AuditLog
            ip = None
            ua = ''
            if request:
                ip = AuditLogService._get_ip(request)
                ua = request.META.get('HTTP_USER_AGENT', '')[:500]

            AuditLog.objects.create(
                actor=actor,
                actor_role=getattr(actor, 'role', '') if actor else '',
                action=action,
                target_type=target_type,
                target_id=target_id,
                metadata=metadata or {},
                ip_address=ip,
                user_agent=ua,
            )
        except Exception as exc:
            logger.warning('AuditLogService failed silently: %s', exc)

    @staticmethod
    def _get_ip(request) -> Optional[str]:
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        if xff:
            return xff.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
