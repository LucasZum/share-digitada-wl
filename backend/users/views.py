import logging
from django.core.cache import cache
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter

from core.permissions import IsAdminRole
from .models import User
from .serializers import UserSerializer, CreateUserSerializer, UpdateUserSerializer, BlockUserSerializer

logger = logging.getLogger(__name__)


class AdminUserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    filter_backends = [SearchFilter]
    search_fields = ['email', 'full_name']

    def get_queryset(self):
        qs = User.objects.all()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateUserSerializer
        if self.action in ('update', 'partial_update'):
            return UpdateUserSerializer
        return UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        from audit_logs.service import AuditLogService
        AuditLogService.log(
            actor=request.user,
            action='user.created',
            target_type='user',
            target_id=str(user.id),
            metadata={'email': user.email, 'role': user.role},
            request=request,
        )

        response_data = UserSerializer(user).data
        response_data['temp_password'] = user._temp_password
        return Response(response_data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        user.soft_delete()
        self._invalidate_cache(user.id)

        from audit_logs.service import AuditLogService
        AuditLogService.log(
            actor=request.user,
            action='user.deleted',
            target_type='user',
            target_id=str(user.id),
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['patch'], url_path='block')
    def block(self, request, pk=None):
        user = self.get_object()
        serializer = BlockUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user.is_active = False
        user.notice_message = serializer.validated_data.get('notice_message', '')
        user.save(update_fields=['is_active', 'notice_message', 'updated_at'])
        self._invalidate_cache(user.id)

        from audit_logs.service import AuditLogService
        AuditLogService.log(
            actor=request.user,
            action='user.blocked',
            target_type='user',
            target_id=str(user.id),
            metadata={'notice_message': user.notice_message},
            request=request,
        )
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=['patch'], url_path='unblock')
    def unblock(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.notice_message = ''
        user.save(update_fields=['is_active', 'notice_message', 'updated_at'])
        self._invalidate_cache(user.id)

        from audit_logs.service import AuditLogService
        AuditLogService.log(
            actor=request.user,
            action='user.unblocked',
            target_type='user',
            target_id=str(user.id),
            request=request,
        )
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=['patch'], url_path='toggle-payment-links')
    def toggle_payment_links(self, request, pk=None):
        user = self.get_object()
        user.payment_links_enabled = not user.payment_links_enabled
        user.save(update_fields=['payment_links_enabled', 'updated_at'])

        from audit_logs.service import AuditLogService
        AuditLogService.log(
            actor=request.user,
            action='user.payment_links_toggled',
            target_type='user',
            target_id=str(user.id),
            metadata={'payment_links_enabled': user.payment_links_enabled},
            request=request,
        )
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=['get'], url_path='metrics')
    def metrics(self, request, pk=None):
        user = self.get_object()
        period = request.query_params.get('period', '30d')

        from transactions.services import TransactionMetricsService
        data = TransactionMetricsService.get_user_metrics(user_id=user.id, period=period)
        return Response(data)

    def _invalidate_cache(self, user_id):
        cache.delete(f'user_active:{user_id}')
