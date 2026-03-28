from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from core.permissions import IsAdminRole
from audit_logs.service import AuditLogService
from .models import WhiteLabelConfig
from .serializers import WhiteLabelSerializer, WhiteLabelUpdateSerializer


class WhiteLabelPublicView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        config = WhiteLabelConfig.get_config()
        return Response(WhiteLabelSerializer(config, context={'request': request}).data)


class WhiteLabelAdminView(APIView):
    permission_classes = [IsAdminRole]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request):
        config = WhiteLabelConfig.get_config()
        serializer = WhiteLabelUpdateSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)

        AuditLogService.log(
            actor=request.user,
            action='white_label.updated',
            target_type='white_label_config',
            target_id=str(config.id),
            metadata={k: str(v) for k, v in request.data.items() if k != 'logo'},
            request=request,
        )

        return Response(WhiteLabelSerializer(config, context={'request': request}).data)
