from rest_framework import generics
from rest_framework.filters import SearchFilter

from core.permissions import IsAdminRole
from core.pagination import TransactionCursorPagination
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = AuditLogSerializer
    pagination_class = TransactionCursorPagination
    filter_backends = [SearchFilter]
    search_fields = ['action', 'actor__email']

    def get_queryset(self):
        qs = AuditLog.objects.select_related('actor').all()
        action = self.request.query_params.get('action')
        if action:
            qs = qs.filter(action=action)
        return qs
