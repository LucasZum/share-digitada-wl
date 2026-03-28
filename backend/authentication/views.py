import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from users.serializers import UserSerializer
from audit_logs.service import AuditLogService
from .serializers import CustomTokenObtainPairSerializer

logger = logging.getLogger(__name__)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            # Log successful login — user is available after super() call
            serializer = self.get_serializer(data=request.data)
            # We re-validate to get the user; it's already validated above
            try:
                serializer.is_valid()
                user = serializer.user
                AuditLogService.log(
                    actor=user,
                    action='auth.login',
                    target_type='user',
                    target_id=str(user.id),
                    request=request,
                )
            except Exception:
                pass
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'detail': 'Refresh token é obrigatório.'}, status=400)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response({'detail': 'Token inválido ou expirado.'}, status=400)

        AuditLogService.log(
            actor=request.user,
            action='auth.logout',
            target_type='user',
            target_id=str(request.user.id),
            request=request,
        )
        return Response({'detail': 'Logout realizado com sucesso.'})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
