import logging
import re
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from users.serializers import UserSerializer
from audit_logs.service import AuditLogService
from .serializers import CustomTokenObtainPairSerializer


def _validate_password_strength(password: str) -> str | None:
    """Returns error message if password is weak, else None."""
    if len(password) < 8:
        return 'A senha deve ter no mínimo 8 caracteres.'
    if not re.search(r'[A-Z]', password):
        return 'A senha deve conter pelo menos uma letra maiúscula.'
    if not re.search(r'[a-z]', password):
        return 'A senha deve conter pelo menos uma letra minúscula.'
    if not re.search(r'\d', password):
        return 'A senha deve conter pelo menos um número.'
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]', password):
        return 'A senha deve conter pelo menos um caractere especial.'
    return None

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


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_password = request.data.get('new_password', '')
        error = _validate_password_strength(new_password)
        if error:
            return Response({'detail': error}, status=400)

        user = request.user
        user.set_password(new_password)
        user.must_change_password = False
        user.save(update_fields=['password', 'must_change_password', 'updated_at'])
        return Response({'detail': 'Senha alterada com sucesso.'})


class AcceptTermsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user.terms_accepted = True
        user.save(update_fields=['terms_accepted', 'updated_at'])
        return Response({'detail': 'Termos aceitos.'})
