from django.db import connection
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        db_ok = False
        redis_ok = False

        try:
            connection.ensure_connection()
            db_ok = True
        except Exception:
            pass

        try:
            cache.set('health_check', '1', timeout=5)
            redis_ok = cache.get('health_check') == '1'
        except Exception:
            pass

        status_code = 200 if (db_ok and redis_ok) else 503
        return Response(
            {'database': 'ok' if db_ok else 'error', 'redis': 'ok' if redis_ok else 'error'},
            status=status_code,
        )
