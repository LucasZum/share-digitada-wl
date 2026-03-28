import json
import logging
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

logger = logging.getLogger(__name__)

EXEMPT_PATHS = {
    '/api/auth/login/',
    '/api/auth/refresh/',
    '/api/config/white-label/',
    '/api/health/',
}


class ActiveUserCheckMiddleware(MiddlewareMixin):
    """
    After JWT auth, validate the user is still active using Redis cache (TTL 60s).
    Blocked users are ejected immediately without a DB hit on every request.
    """

    def process_request(self, request):
        if request.path in EXEMPT_PATHS:
            return None

        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return None

        token_str = auth_header.split(' ', 1)[1]
        try:
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token_str)
            user_id = str(validated_token.get('user_id'))
        except (InvalidToken, TokenError):
            return None

        cache_key = f'user_active:{user_id}'
        cached = cache.get(cache_key)

        if cached is None:
            from users.models import User
            try:
                user = User.objects.only('is_active', 'notice_message').get(pk=user_id)
                cached = {'is_active': user.is_active, 'notice_message': user.notice_message or ''}
                cache.set(cache_key, cached, timeout=60)
            except User.DoesNotExist:
                return JsonResponse({'detail': 'Usuário não encontrado.', 'code': 'user_not_found'}, status=401)

        if not cached['is_active']:
            notice = cached.get('notice_message') or 'Sua conta está suspensa. Entre em contato com o administrador.'
            return JsonResponse({'detail': notice, 'code': 'account_inactive'}, status=403)

        return None


class RLSMiddleware(MiddlewareMixin):
    """
    Sets PostgreSQL session variables for Row-Level Security policies.
    Sets app.current_user_id and app.current_role so RLS policies can filter rows.
    """

    def process_request(self, request):
        request._rls_set = False
        return None

    def process_response(self, request, response):
        return response

    @staticmethod
    def set_rls_variables(connection, user_id: str, role: str):
        with connection.cursor() as cursor:
            cursor.execute(
                "SET LOCAL app.current_user_id = %s; SET LOCAL app.current_role = %s;",
                [str(user_id), role]
            )
