from rest_framework import generics
from core.permissions import IsAdminRole
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        qs = Notification.objects.all()
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            qs = qs.filter(is_read=is_read.lower() == 'true')
        return qs
