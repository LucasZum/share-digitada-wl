# Share — POS Digitada Online
## Guia Completo de Implementação

> **Versão:** 1.0 — MVP Production-Ready  
> **Stack:** Django (DRF) + PostgreSQL + React (Next.js) + Stripe  
> **Objetivo:** Sistema White Label de maquininha digital com painel Admin Master

---

## Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Modelagem do Banco de Dados](#2-modelagem-do-banco-de-dados)
3. [Segurança & Cybersegurança](#3-segurança--cybersegurança)
4. [Roadmap de Desenvolvimento — MVP](#4-roadmap-de-desenvolvimento--mvp)
   - [Fase 0 — Setup & Infraestrutura](#fase-0--setup--infraestrutura)
   - [Fase 1 — Autenticação & Roles](#fase-1--autenticação--roles)
   - [Fase 2 — Gestão de Usuários (Admin)](#fase-2--gestão-de-usuários-admin)
   - [Fase 3 — Integração Stripe](#fase-3--integração-stripe)
   - [Fase 4 — Módulo de Vendas (POS)](#fase-4--módulo-de-vendas-pos)
   - [Fase 5 — Dashboard & Relatórios Admin](#fase-5--dashboard--relatórios-admin)
   - [Fase 6 — White Label](#fase-6--white-label)
   - [Fase 7 — Audit Log & Notificações](#fase-7--audit-log--notificações)
   - [Fase 8 — Hardening & QA](#fase-8--hardening--qa)
5. [Estrutura de Pastas](#5-estrutura-de-pastas)
6. [Contratos de API](#6-contratos-de-api)
7. [Checklist de Entrega MVP](#7-checklist-de-entrega-mvp)

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
│  ┌──────────────────┐    ┌─────────────────────────┐    │
│  │  Portal Usuário   │    │    Painel Admin Master  │    │
│  │  /pos  /history   │    │    /admin/dashboard     │    │
│  └──────────────────┘    └─────────────────────────┘    │
└──────────────────────────────┬──────────────────────────┘
                               │ HTTPS + JWT
┌──────────────────────────────▼──────────────────────────┐
│              BACKEND (Django + DRF)                      │
│  Auth · Users · Stripe Accounts · Transactions           │
│  Reports · Audit Log · Notifications · White Label        │
│                                                          │
│  Celery Beat → tarefas agendadas (notificações/alertas)  │
└──────────────┬────────────────────────┬─────────────────┘
               │                        │
┌──────────────▼──────┐    ┌────────────▼──────────────┐
│  PostgreSQL + RLS   │    │      Stripe Python SDK     │
│  (dados isolados    │    │  PaymentIntent · Confirm   │
│   por tenant)       │    │  + Polling de status       │
└─────────────────────┘    └───────────────────────────┘
         │
┌────────▼────────────┐
│  Redis              │
│  JWT blacklist      │
│  Rate limiting      │
│  Celery broker      │
│  Dashboard cache    │
└─────────────────────┘
```

### Dependências Python — requirements.txt

```
# Core
django==5.0.*
djangorestframework==3.15.*
django-cors-headers==4.3.*

# Auth
djangorestframework-simplejwt==5.3.*

# Banco
psycopg2-binary==2.9.*

# Redis
redis==5.0.*
django-redis==5.4.*

# Celery (tarefas agendadas)
celery==5.3.*
django-celery-beat==2.6.*

# Criptografia
cryptography==42.*

# Stripe
stripe==9.*

# Rate limiting & bloqueio de login
django-ratelimit==4.1.*
django-axes==6.*

# Utilitários
python-decouple==3.8
Pillow==10.*

# Exportação
openpyxl==3.1.*

# Monitoramento
sentry-sdk[django]==1.44.*
```

### Premissas do MVP

- O sistema **não emite cobranças automáticas** — gera relatórios para cobrança manual pelo Admin.
- A validação de pagamento é feita via **polling** (`GET /payment_intents/:id`) pois o fluxo é síncrono e rápido (cartão presente).
- Cartões que exijam **3DS** são recusados na v1 com mensagem orientando o cliente a usar outro cartão.
- O backend **nunca expõe as chaves Stripe do usuário ao frontend** — todas as chamadas à Stripe são feitas server-side.
- Cada usuário opera com sua **própria conta Stripe**. O SaaS é apenas a interface gráfica.

---

## 2. Modelagem do Banco de Dados

### Models Django

```python
# users/models.py
import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password, **extra_fields):
        email = self.normalize_email(email)
        user  = self.model(email=email, **extra_fields)
        user.set_password(password)   # Django usa PBKDF2 — seguro por padrão
        user.save()
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields['role'] = 'admin'
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin Master'
        USER  = 'user',  'Usuário'

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email          = models.EmailField(unique=True)
    full_name      = models.CharField(max_length=255, blank=True)
    role           = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)
    is_active      = models.BooleanField(default=True)
    notice_message = models.TextField(null=True, blank=True)  # aviso na tela inicial
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)
    deleted_at     = models.DateTimeField(null=True, blank=True)  # soft delete

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = []
    objects = UserManager()

    class Meta:
        db_table = 'users'

    @property
    def is_staff(self):
        return self.role == self.Role.ADMIN


# stripe_accounts/models.py
class StripeAccount(models.Model):
    id                   = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user                 = models.ForeignKey(User, on_delete=models.PROTECT, related_name='stripe_accounts')
    publishable_key      = models.CharField(max_length=255)
    secret_key_encrypted = models.TextField()         # AES-256-GCM — nunca texto puro
    stripe_account_id    = models.CharField(max_length=255, null=True, blank=True)
    is_active            = models.BooleanField(default=True)
    activated_at         = models.DateTimeField(auto_now_add=True)
    deactivated_at       = models.DateTimeField(null=True, blank=True)
    created_at           = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stripe_accounts'


# transactions/models.py
class Transaction(models.Model):
    class Status(models.TextChoices):
        PENDING    = 'pending',    'Pendente'
        PROCESSING = 'processing', 'Processando'
        SUCCEEDED  = 'succeeded',  'Aprovado'
        FAILED     = 'failed',     'Recusado'
        CANCELED   = 'canceled',   'Cancelado'

    class PaymentMethod(models.TextChoices):
        CARD_DIGITAL = 'card_digital', 'Venda Digitada'
        CARD_PRESENT = 'card_present', 'Aproximação/Leitor'

    id                       = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user                     = models.ForeignKey(User, on_delete=models.PROTECT, related_name='transactions')
    stripe_account           = models.ForeignKey(StripeAccount, on_delete=models.PROTECT)
    stripe_payment_intent_id = models.CharField(max_length=255, db_index=True)
    amount                   = models.PositiveIntegerField()    # em centavos
    currency                 = models.CharField(max_length=3, default='brl')
    status                   = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_method           = models.CharField(max_length=20, choices=PaymentMethod.choices)
    card_last4               = models.CharField(max_length=4, null=True, blank=True)
    card_brand               = models.CharField(max_length=20, null=True, blank=True)
    error_message            = models.TextField(null=True, blank=True)
    created_at               = models.DateTimeField(auto_now_add=True)
    updated_at               = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transactions'
        indexes  = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['status']),
        ]


# audit_logs/models.py
class AuditLog(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor       = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    actor_role  = models.CharField(max_length=10, blank=True)
    action      = models.CharField(max_length=100, db_index=True)
    target_type = models.CharField(max_length=50, null=True, blank=True)
    target_id   = models.UUIDField(null=True, blank=True)
    metadata    = models.JSONField(null=True, blank=True)
    ip_address  = models.GenericIPAddressField(null=True)
    user_agent  = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']


# white_label/models.py
class WhiteLabelConfig(models.Model):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    logo            = models.ImageField(upload_to='white_label/', null=True, blank=True)
    primary_color   = models.CharField(max_length=7, default='#1E3A5F')
    secondary_color = models.CharField(max_length=7, default='#FFFFFF')
    brand_name      = models.CharField(max_length=100, default='Share')
    custom_domain   = models.CharField(max_length=255, null=True, blank=True)
    updated_at      = models.DateTimeField(auto_now=True)
    updated_by      = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'white_label_config'
```

### Row-Level Security (RLS) — PostgreSQL

Criar uma migration dedicada logo após a migration inicial das tabelas:

```python
# migrations/0002_enable_rls.py
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [('transactions', '0001_initial')]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
                ALTER TABLE stripe_accounts ENABLE ROW LEVEL SECURITY;

                CREATE POLICY user_transactions ON transactions
                  FOR ALL
                  USING (
                    user_id::text = current_setting('app.current_user_id', true)
                    OR current_setting('app.current_role', true) = 'admin'
                  );

                CREATE POLICY user_stripe_accounts ON stripe_accounts
                  FOR ALL
                  USING (
                    user_id::text = current_setting('app.current_user_id', true)
                    OR current_setting('app.current_role', true) = 'admin'
                  );
            """,
            reverse_sql="""
                DROP POLICY IF EXISTS user_transactions ON transactions;
                DROP POLICY IF EXISTS user_stripe_accounts ON stripe_accounts;
                ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
                ALTER TABLE stripe_accounts DISABLE ROW LEVEL SECURITY;
            """
        )
    ]
```

O middleware abaixo seta as variáveis de sessão do PostgreSQL para o RLS funcionar:

```python
# core/middleware.py
from django.db import connection

class RLSMiddleware:
    """
    Injeta o user_id e role do usuário autenticado nas variáveis
    de sessão do PostgreSQL, ativando as políticas de RLS.
    Deve estar APÓS os middlewares de autenticação no settings.py.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT set_config('app.current_user_id', %s, true),"
                    "       set_config('app.current_role', %s, true)",
                    [str(user.id), user.role]
                )
        return self.get_response(request)
```

---

## 3. Segurança & Cybersegurança

### 3.1 Autenticação

Usar **djangorestframework-simplejwt** com configuração endurecida:

```python
# settings.py
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':    timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME':   timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':    True,   # cada uso emite novo refresh token
    'BLACKLIST_AFTER_ROTATION': True,   # invalida o anterior imediatamente
    'ALGORITHM':                'HS256',
    'SIGNING_KEY':              env('JWT_SECRET'),
    'AUTH_HEADER_TYPES':        ('Bearer',),
    'USER_ID_FIELD':            'id',
    'TOKEN_OBTAIN_SERIALIZER':  'auth.serializers.CustomTokenObtainPairSerializer',
}

INSTALLED_APPS = [
    ...
    'rest_framework_simplejwt.token_blacklist',  # habilita blacklist de refresh tokens
]
```

```python
# auth/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Embute role e nome no JWT — evita query ao banco em cada request
        token['role']      = user.role
        token['full_name'] = user.full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Bloquear usuário inativo antes de emitir token
        if not self.user.is_active:
            raise serializers.ValidationError(
                self.user.notice_message or 'Conta bloqueada. Entre em contato com o administrador.'
            )
        return data
```

**Bloqueio automático por tentativas falhas — django-axes:**

```python
# settings.py
INSTALLED_APPS += ['axes']
MIDDLEWARE    += ['axes.middleware.AxesMiddleware']

AXES_FAILURE_LIMIT    = 5        # bloqueia após 5 tentativas
AXES_COOLOFF_TIME     = 0.25     # 15 minutos (fração de hora)
AXES_RESET_ON_SUCCESS = True     # zera contador após login bem-sucedido
AXES_LOCK_OUT_BY_COMBINATION_USER_AND_IP = True
```

### 3.2 Proteção das Chaves Stripe

```python
# core/crypto.py
import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def _get_key() -> bytes:
    return bytes.fromhex(os.environ['ENCRYPTION_KEY'])   # 64 chars hex = 32 bytes

def encrypt(plaintext: str) -> str:
    """Retorna 'nonce_b64:ciphertext_b64' — inclui auth tag dentro do ct."""
    key    = _get_key()
    nonce  = os.urandom(12)   # 96 bits — nunca reutilizar
    ct     = AESGCM(key).encrypt(nonce, plaintext.encode(), None)
    return f"{base64.b64encode(nonce).decode()}:{base64.b64encode(ct).decode()}"

def decrypt(stored: str) -> str:
    key          = _get_key()
    nonce_b64, ct_b64 = stored.split(':')
    return AESGCM(key).decrypt(
        base64.b64decode(nonce_b64),
        base64.b64decode(ct_b64),
        None
    ).decode()
```

Regras de uso:
- `encrypt()` é chamado apenas ao salvar a secret key no banco.
- `decrypt()` é chamado apenas dentro do `StripeService`, no escopo da chamada à API, e descartado imediatamente após.
- A `ENCRYPTION_KEY` existe apenas nas variáveis de ambiente do servidor.
- A `secret_key` jamais é retornada ao frontend nem registrada em logs.

### 3.3 Permissões & RBAC com DRF

```python
# core/permissions.py
from rest_framework.permissions import BasePermission

class IsAdminRole(BasePermission):
    """Permite acesso apenas a usuários com role='admin'."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )

class IsActiveUser(BasePermission):
    """Bloqueia usuários desativados mesmo com token JWT ainda válido."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_active
            and request.user.deleted_at is None
        )

class IsOwnerOrAdmin(BasePermission):
    """Garante que o objeto pertence ao usuário autenticado."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        owner_id = getattr(obj, 'user_id', None) or getattr(obj.user, 'id', None)
        return str(owner_id) == str(request.user.id)
```

### 3.4 Verificação de Usuário Ativo por Middleware

O token JWT tem TTL de 15 minutos. Para bloquear um usuário com efeito imediato, o middleware
re-consulta o estado do usuário a cada request, usando cache Redis para não sobrecarregar o banco:

```python
# core/middleware.py
class ActiveUserCheckMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            from django.core.cache import cache
            from django.http import JsonResponse
            from users.models import User

            cache_key = f'user_active:{user.id}'
            cached    = cache.get(cache_key)

            if cached is None:
                try:
                    fresh  = User.objects.only('is_active', 'deleted_at', 'notice_message').get(pk=user.pk)
                    active = fresh.is_active and fresh.deleted_at is None
                    # Salva resultado no cache por 60 segundos
                    cache.set(cache_key, {'active': active, 'notice': fresh.notice_message}, timeout=60)
                except User.DoesNotExist:
                    active = False
                    cache.set(cache_key, {'active': False, 'notice': None}, timeout=60)
            else:
                active = cached['active']

            if not active:
                notice = (cached or {}).get('notice') or 'Conta desativada.'
                return JsonResponse({'detail': notice, 'code': 'account_inactive'}, status=403)

        return self.get_response(request)
```

> Ao bloquear um usuário no Admin, sempre chamar `cache.delete(f'user_active:{user.id}')` para invalidar o cache e garantir efeito imediato.

### 3.5 Configurações de Segurança — settings.py (produção)

```python
DEBUG = False

# Headers HTTP de segurança
SECURE_SSL_REDIRECT            = True
SECURE_HSTS_SECONDS            = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD            = True
SECURE_CONTENT_TYPE_NOSNIFF    = True
X_FRAME_OPTIONS                = 'DENY'
SECURE_BROWSER_XSS_FILTER      = True
SESSION_COOKIE_SECURE          = True
SESSION_COOKIE_HTTPONLY        = True
CSRF_COOKIE_SECURE             = True

# CORS — apenas o frontend autorizado
CORS_ALLOWED_ORIGINS  = [env('FRONTEND_URL')]
CORS_ALLOW_CREDENTIALS = True

# DRF — configurações globais
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
        'core.permissions.IsActiveUser',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '20/minute',
        'user': '100/minute',
    },
    'DEFAULT_PAGINATION_CLASS': 'core.pagination.StandardPagination',
    'PAGE_SIZE': 20,
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
}
```

### 3.6 Logging — Mascarar Dados Sensíveis

```python
# core/logging.py
import logging, re

SENSITIVE_PATTERNS = [
    r'sk_[a-zA-Z0-9_]+',
    r'pk_[a-zA-Z0-9_]+',
    r'\b\d{13,19}\b',
    r'"password"\s*:\s*"[^"]+"',
]

class MaskSensitiveFilter(logging.Filter):
    def filter(self, record):
        msg = str(record.getMessage())
        for p in SENSITIVE_PATTERNS:
            msg = re.sub(p, '***REDACTED***', msg)
        record.msg  = msg
        record.args = ()
        return True
```

---

## 4. Roadmap de Desenvolvimento — MVP

---

### Fase 0 — Setup & Infraestrutura

**Duração estimada: 2–3 dias**

#### 0.1 — Estrutura de Apps Django

```bash
django-admin startproject config .
python manage.py startapp users
python manage.py startapp stripe_accounts
python manage.py startapp transactions
python manage.py startapp admin_dashboard
python manage.py startapp audit_logs
python manage.py startapp notifications
python manage.py startapp white_label
```

Criar também o app `core` manualmente — ele não tem models próprios, apenas código compartilhado (permissions, middleware, crypto, pagination, exceptions).

#### 0.2 — Variáveis de Ambiente (python-decouple)

```python
# config/settings.py
from decouple import config, Csv

SECRET_KEY    = config('DJANGO_SECRET_KEY')
DEBUG         = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=Csv())

DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.postgresql',
        'NAME':     config('DB_NAME'),
        'USER':     config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST':     config('DB_HOST', default='localhost'),
        'PORT':     config('DB_PORT', default='5432'),
    }
}

CACHES = {
    'default': {
        'BACKEND':  'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://localhost:6379/0'),
        'OPTIONS':  {'CLIENT_CLASS': 'django_redis.client.DefaultClient'},
    }
}
```

Criar `.env.example` com todas as variáveis documentadas:

```env
DJANGO_SECRET_KEY=<string-aleatória-50-chars>
DEBUG=False
ALLOWED_HOSTS=api.sharepos.com.br
DB_NAME=sharepos
DB_USER=sharepos_app
DB_PASSWORD=<senha-forte>
DB_HOST=localhost
REDIS_URL=redis://localhost:6379/0
ENCRYPTION_KEY=<hex-string-64-chars>
JWT_SECRET=<string-aleatória-64-chars>
FRONTEND_URL=https://sharepos.com.br
```

#### 0.3 — Docker Compose Local

```yaml
services:
  api:
    build: .
    command: python manage.py runserver 0.0.0.0:8000
    volumes: [".:/app"]
    ports: ["8000:8000"]
    depends_on: [postgres, redis]
    env_file: .env

  celery:
    build: .
    command: celery -A config worker -B --loglevel=info
    depends_on: [postgres, redis]
    env_file: .env

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: sharepos
      POSTGRES_USER: sharepos_app
      POSTGRES_PASSWORD: senha_local
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  pgdata:
```

#### 0.4 — Migrations & Seeder

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser_admin
```

```python
# users/management/commands/createsuperuser_admin.py
from django.core.management.base import BaseCommand
from users.models import User

class Command(BaseCommand):
    def handle(self, *args, **options):
        if not User.objects.filter(email='admin@sharepos.com').exists():
            User.objects.create_user(
                email='admin@sharepos.com',
                password='SenhaForte@123',
                full_name='Admin Master',
                role='admin',
            )
            self.stdout.write(self.style.SUCCESS('Admin criado com sucesso.'))
```

#### 0.5 — CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: test_sharepos
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -r requirements.txt
      - run: python -m flake8 . --max-line-length=100
      - run: python manage.py test --settings=config.settings_test
      - run: pip-audit   # verifica vulnerabilidades em dependências
```

---

### Fase 1 — Autenticação & Roles

**Duração estimada: 3–4 dias**

#### 1.1 — Views de Auth

```python
# auth/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from audit_logs.service import AuditLogService

class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class   = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            AuditLogService.log(
                action='auth.login',
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
            )
        return response

    def _get_client_ip(self, request):
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        return forwarded.split(',')[0].strip() if forwarded else request.META.get('REMOTE_ADDR')


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            token = RefreshToken(request.data['refresh'])
            token.blacklist()   # simplejwt coloca na blacklist
        except Exception:
            pass   # token já inválido — não expor erro
        return Response({'detail': 'Logout realizado.'})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from users.serializers import UserSerializer
        return Response(UserSerializer(request.user).data)
```

#### 1.2 — URLs

```python
# config/urls.py
from django.urls import path, include

urlpatterns = [
    path('api/auth/login/',   CustomTokenObtainPairView.as_view()),
    path('api/auth/refresh/', TokenRefreshView.as_view()),
    path('api/auth/logout/',  LogoutView.as_view()),
    path('api/auth/me/',      MeView.as_view()),
    path('api/', include('users.urls')),
    path('api/', include('stripe_accounts.urls')),
    path('api/', include('transactions.urls')),
    path('api/', include('admin_dashboard.urls')),
    path('api/', include('audit_logs.urls')),
    path('api/', include('white_label.urls')),
    path('api/health/', HealthCheckView.as_view()),
]
```

---

### Fase 2 — Gestão de Usuários (Admin)

**Duração estimada: 4–5 dias**

#### 2.1 — AdminUserViewSet

```python
# users/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsAdminRole, IsActiveUser
from django.core.cache import cache
from django.utils import timezone
from .models import User
from .serializers import UserSerializer, CreateUserSerializer
from audit_logs.service import AuditLogService
import secrets, string

class AdminUserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsActiveUser, IsAdminRole]
    serializer_class   = UserSerializer
    queryset           = User.objects.filter(deleted_at__isnull=True).order_by('-created_at')

    def get_queryset(self):
        qs     = super().get_queryset()
        search = self.request.query_params.get('search')
        active = self.request.query_params.get('active')
        if search:
            qs = qs.filter(email__icontains=search) | qs.filter(full_name__icontains=search)
        if active is not None:
            qs = qs.filter(is_active=(active == 'true'))
        return qs

    def create(self, request, *args, **kwargs):
        serializer = CreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Gerar senha temporária forte
        alphabet  = string.ascii_letters + string.digits + '!@#$%'
        temp_pass = ''.join(secrets.choice(alphabet) for _ in range(12))

        user = User.objects.create_user(
            email=serializer.validated_data['email'],
            password=temp_pass,
            full_name=serializer.validated_data.get('full_name', ''),
            role='user',
        )
        AuditLogService.log(
            actor=request.user, action='user.created',
            target_type='user', target_id=user.id,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )
        # Retorna senha temporária UMA única vez — não é armazenada em texto puro
        return Response(
            {**UserSerializer(user).data, 'temporary_password': temp_pass},
            status=status.HTTP_201_CREATED
        )

    def destroy(self, request, *args, **kwargs):
        """Soft delete — preserva todo o histórico de transações."""
        user = self.get_object()
        user.deleted_at = timezone.now()
        user.is_active  = False
        user.save()
        cache.delete(f'user_active:{user.id}')
        AuditLogService.log(
            actor=request.user, action='user.deleted',
            target_type='user', target_id=user.id,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['patch'])
    def block(self, request, pk=None):
        user = self.get_object()
        user.is_active      = False
        user.notice_message = request.data.get('notice_message')
        user.save()
        cache.delete(f'user_active:{user.id}')    # efeito imediato
        AuditLogService.log(
            actor=request.user, action='user.blocked',
            target_type='user', target_id=user.id,
            metadata={'notice': user.notice_message},
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=['patch'])
    def unblock(self, request, pk=None):
        user = self.get_object()
        user.is_active      = True
        user.notice_message = None
        user.save()
        cache.delete(f'user_active:{user.id}')
        AuditLogService.log(
            actor=request.user, action='user.unblocked',
            target_type='user', target_id=user.id,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=['get'])
    def metrics(self, request, pk=None):
        """Métricas individuais — volume, ticket médio, mensalidade devida."""
        from transactions.services import TransactionMetricsService
        user   = self.get_object()
        period = request.query_params.get('period', '30d')
        return Response(TransactionMetricsService.get_user_metrics(user, period))
```

---

### Fase 3 — Integração Stripe

**Duração estimada: 3–4 dias**

#### 3.1 — StripeService

```python
# stripe_accounts/stripe_service.py
import stripe
from core.crypto import decrypt
from .models import StripeAccount

STRIPE_API_VERSION = '2024-06-20'

class StripeService:
    """
    Toda comunicação com a Stripe passa por aqui.
    A secret key é descriptografada no escopo de cada método e descartada.
    Nenhum cliente Stripe é mantido em memória entre requests.
    """

    @staticmethod
    def _client(account: StripeAccount) -> stripe.Stripe:
        secret = decrypt(account.secret_key_encrypted)
        return stripe.Stripe(secret, api_version=STRIPE_API_VERSION)

    @classmethod
    def validate_credentials(cls, secret_key: str) -> bool:
        """Chama balance.retrieve() como validação leve antes de salvar."""
        try:
            client = stripe.Stripe(secret_key, api_version=STRIPE_API_VERSION)
            client.balance.retrieve()
            return True
        except (stripe.AuthenticationError, stripe.PermissionError):
            return False
        except Exception:
            return False

    @classmethod
    def create_payment_intent(cls, account: StripeAccount, amount_cents: int, currency='brl'):
        return cls._client(account).payment_intents.create(
            amount=amount_cents,
            currency=currency,
            payment_method_types=['card'],
            capture_method='automatic',
        )

    @classmethod
    def confirm_payment_intent(cls, account: StripeAccount, pi_id: str,
                                card_number: str, exp_month: int, exp_year: int, cvc: str):
        client = cls._client(account)
        pm = client.payment_methods.create(
            type='card',
            card={'number': card_number, 'exp_month': exp_month,
                  'exp_year': exp_year, 'cvc': cvc},
        )
        return client.payment_intents.confirm(
            pi_id,
            payment_method=pm.id,
            payment_method_options={'card': {'request_three_d_secure': 'any'}},
        )

    @classmethod
    def poll_status(cls, account: StripeAccount, pi_id: str):
        return cls._client(account).payment_intents.retrieve(pi_id)
```

#### 3.2 — View de Contas Stripe

```python
# stripe_accounts/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsActiveUser
from core.crypto import encrypt
from django.utils import timezone
from audit_logs.service import AuditLogService
from .models import StripeAccount
from .stripe_service import StripeService

class StripeAccountView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser]

    def get(self, request):
        accounts = StripeAccount.objects.filter(user=request.user).order_by('-created_at')
        return Response([{
            'id':              str(a.id),
            'publishable_key': a.publishable_key,
            'is_active':       a.is_active,
            'activated_at':    a.activated_at,
            'deactivated_at':  a.deactivated_at,
        } for a in accounts])

    def post(self, request):
        pk  = request.data.get('publishable_key', '').strip()
        sk  = request.data.get('secret_key', '').strip()

        if not pk.startswith('pk_'):
            return Response({'detail': 'Publishable key inválida.'}, status=422)
        if not sk.startswith('sk_'):
            return Response({'detail': 'Secret key inválida.'}, status=422)

        if not StripeService.validate_credentials(sk):
            return Response({'detail': 'Credenciais Stripe inválidas ou conta inativa.'}, status=422)

        # Desativar contas anteriores
        StripeAccount.objects.filter(user=request.user, is_active=True).update(
            is_active=False, deactivated_at=timezone.now()
        )

        account = StripeAccount.objects.create(
            user=request.user,
            publishable_key=pk,
            secret_key_encrypted=encrypt(sk),   # sk é criptografada aqui e descartada
            is_active=True,
        )

        AuditLogService.log(
            actor=request.user, action='stripe.account_linked',
            target_type='stripe_account', target_id=account.id,
            metadata={'pk_suffix': pk[-6:]},    # nunca logar a sk
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        return Response({'id': str(account.id), 'publishable_key': pk, 'is_active': True}, status=201)
```

---

### Fase 4 — Módulo de Vendas (POS)

**Duração estimada: 4–5 dias**

#### 4.1 — Views de Transação

```python
# transactions/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsActiveUser
from audit_logs.service import AuditLogService
from stripe_accounts.models import StripeAccount
from stripe_accounts.stripe_service import StripeService
from .models import Transaction
from .serializers import TransactionSerializer
import stripe

STRIPE_ERRORS = {
    'card_declined':          'Cartão recusado. Tente outro cartão.',
    'insufficient_funds':     'Saldo insuficiente.',
    'incorrect_cvc':          'CVV incorreto.',
    'expired_card':           'Cartão vencido.',
    'incorrect_number':       'Número do cartão inválido.',
    'card_velocity_exceeded': 'Limite do cartão atingido.',
    'do_not_honor':           'Não autorizado pelo banco emissor.',
    'processing_error':       'Erro de processamento. Tente novamente.',
}


class TransactionCreateView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser]

    def post(self, request):
        amount = request.data.get('amount')
        if not isinstance(amount, int) or amount <= 0:
            return Response({'detail': 'Valor inválido.'}, status=422)
        if amount > 9_999_900:
            return Response({'detail': 'Valor acima do limite permitido.'}, status=422)

        try:
            stripe_account = StripeAccount.objects.get(user=request.user, is_active=True)
        except StripeAccount.DoesNotExist:
            return Response({
                'detail': 'Nenhuma conta Stripe configurada. Acesse Configurações.',
                'code': 'no_stripe_account'
            }, status=422)

        try:
            pi = StripeService.create_payment_intent(stripe_account, amount)
        except stripe.StripeError:
            return Response({'detail': 'Erro ao iniciar pagamento. Tente novamente.'}, status=502)

        tx = Transaction.objects.create(
            user=request.user,
            stripe_account=stripe_account,
            stripe_payment_intent_id=pi.id,
            amount=amount,
            status=Transaction.Status.PENDING,
            payment_method=Transaction.PaymentMethod.CARD_DIGITAL,
        )
        AuditLogService.log(
            actor=request.user, action='transaction.created',
            target_type='transaction', target_id=tx.id,
            metadata={'amount': amount},
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )
        return Response({'transaction_id': str(tx.id), 'amount': amount, 'status': tx.status}, status=201)


class TransactionConfirmView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser]

    def post(self, request, pk):
        try:
            tx = Transaction.objects.select_related('stripe_account').get(pk=pk, user=request.user)
        except Transaction.DoesNotExist:
            return Response({'detail': 'Transação não encontrada.'}, status=404)

        if tx.status != Transaction.Status.PENDING:
            return Response({'detail': 'Transação já processada.'}, status=409)

        card_number = request.data.get('card_number', '').replace(' ', '')
        exp_month   = request.data.get('exp_month')
        exp_year    = request.data.get('exp_year')
        cvc         = request.data.get('cvc')

        tx.status = Transaction.Status.PROCESSING
        tx.save(update_fields=['status', 'updated_at'])

        try:
            pi = StripeService.confirm_payment_intent(
                tx.stripe_account, tx.stripe_payment_intent_id,
                card_number, exp_month, exp_year, cvc,
            )

            if pi.status == 'succeeded':
                card          = pi.payment_method_details.card
                tx.status     = Transaction.Status.SUCCEEDED
                tx.card_last4 = card.last4
                tx.card_brand = card.brand
                action = 'transaction.succeeded'

            elif pi.status == 'requires_action':
                # 3DS — recusado no MVP
                tx.status        = Transaction.Status.FAILED
                tx.error_message = 'Cartão requer autenticação adicional. Use outro cartão.'
                action = 'transaction.failed'

            else:
                tx.status        = Transaction.Status.FAILED
                tx.error_message = 'Pagamento não autorizado.'
                action = 'transaction.failed'

        except stripe.CardError as e:
            tx.status        = Transaction.Status.FAILED
            tx.error_message = STRIPE_ERRORS.get(e.code or '', 'Pagamento recusado.')
            action = 'transaction.failed'

        except stripe.StripeError:
            tx.status        = Transaction.Status.FAILED
            tx.error_message = 'Erro de comunicação com a operadora. Tente novamente.'
            action = 'transaction.failed'

        tx.save()
        AuditLogService.log(
            actor=request.user, action=action,
            target_type='transaction', target_id=tx.id,
            metadata={'amount': tx.amount, 'error': tx.error_message},
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )
        return Response(TransactionSerializer(tx).data)


class TransactionStatusView(APIView):
    """Polling — frontend chama a cada 1s por no máximo 30s."""
    permission_classes = [IsAuthenticated, IsActiveUser]

    def get(self, request, pk):
        try:
            tx = Transaction.objects.select_related('stripe_account').get(pk=pk, user=request.user)
        except Transaction.DoesNotExist:
            return Response({'detail': 'Transação não encontrada.'}, status=404)

        # Já finalizada — retorna do banco sem chamar a Stripe
        if tx.status in (Transaction.Status.SUCCEEDED, Transaction.Status.FAILED, Transaction.Status.CANCELED):
            return Response(TransactionSerializer(tx).data)

        # Ainda em processing — consultar a Stripe
        try:
            pi = StripeService.poll_status(tx.stripe_account, tx.stripe_payment_intent_id)
            if pi.status == 'succeeded':
                card          = pi.payment_method_details.card
                tx.status     = Transaction.Status.SUCCEEDED
                tx.card_last4 = card.last4
                tx.card_brand = card.brand
                tx.save()
        except Exception:
            pass   # polling não deve quebrar — retorna status atual

        return Response(TransactionSerializer(tx).data)
```

---

### Fase 5 — Dashboard & Relatórios Admin

**Duração estimada: 4–5 dias**

#### 5.1 — TransactionMetricsService

```python
# transactions/services.py
from django.db import models as db_models
from django.db.models.functions import TruncDate
from django.utils import timezone
from django.core.cache import cache
from datetime import timedelta
from .models import Transaction

class TransactionMetricsService:

    @staticmethod
    def _date_range(period: str):
        now    = timezone.now()
        ranges = {
            'today': (now.replace(hour=0, minute=0, second=0, microsecond=0), now),
            '7d':    (now - timedelta(days=7), now),
            '30d':   (now - timedelta(days=30), now),
        }
        return ranges.get(period, ranges['30d'])

    @classmethod
    def get_global_metrics(cls, period: str) -> dict:
        cache_key = f'admin_metrics:{period}'
        if cached := cache.get(cache_key):
            return cached

        start, end = cls._date_range(period)
        qs        = Transaction.objects.filter(created_at__range=(start, end))
        succeeded = qs.filter(status='succeeded')
        result    = succeeded.aggregate(
            total_volume=db_models.Sum('amount'),
            count=db_models.Count('id'),
            avg_ticket=db_models.Avg('amount'),
        )
        total      = qs.count()
        approval   = (result['count'] / total) if total > 0 else 0

        data = {
            'period':               {'start': start.isoformat(), 'end': end.isoformat()},
            'total_volume_cents':   result['total_volume'] or 0,
            'transaction_count':    result['count'] or 0,
            'average_ticket_cents': int(result['avg_ticket'] or 0),
            'approval_rate':        round(approval, 4),
            'active_users_count':   succeeded.values('user').distinct().count(),
        }
        cache.set(cache_key, data, timeout=60)
        return data

    @classmethod
    def get_chart_data(cls, period: str) -> list:
        start, end = cls._date_range(period)
        return list(
            Transaction.objects.filter(
                created_at__range=(start, end), status='succeeded'
            )
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(volume=db_models.Sum('amount'), count=db_models.Count('id'))
            .order_by('date')
        )

    @classmethod
    def get_user_metrics(cls, user, period: str) -> dict:
        start, end = cls._date_range(period)
        result = Transaction.objects.filter(
            user=user, status='succeeded', created_at__range=(start, end)
        ).aggregate(
            total_volume=db_models.Sum('amount'),
            count=db_models.Count('id'),
            avg_ticket=db_models.Avg('amount'),
        )
        volume = result['total_volume'] or 0
        return {
            'total_volume_cents':   volume,
            'transaction_count':    result['count'] or 0,
            'average_ticket_cents': int(result['avg_ticket'] or 0),
            'monthly_fee_cents':    int(volume * 0.05),   # 5% de mensalidade
        }

    @classmethod
    def get_billing_report(cls, year: int, month: int) -> list:
        import calendar
        from users.models import User
        from django.db.models import Q

        _, last_day = calendar.monthrange(year, month)
        start = timezone.datetime(year, month, 1, tzinfo=timezone.utc)
        end   = timezone.datetime(year, month, last_day, 23, 59, 59, tzinfo=timezone.utc)

        return list(
            User.objects.filter(role='user', deleted_at__isnull=True)
            .annotate(
                volume=db_models.Sum(
                    'transactions__amount',
                    filter=Q(transactions__status='succeeded',
                             transactions__created_at__range=(start, end))
                ),
                tx_count=db_models.Count(
                    'transactions',
                    filter=Q(transactions__status='succeeded',
                             transactions__created_at__range=(start, end))
                ),
            )
            .values('id', 'full_name', 'email', 'volume', 'tx_count')
            .order_by(db_models.F('volume').desc(nulls_last=True))
        )
```

#### 5.2 — Views do Dashboard

```python
# admin_dashboard/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsAdminRole, IsActiveUser
from transactions.services import TransactionMetricsService
from django.http import HttpResponse
from django.utils import timezone
import csv

class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser, IsAdminRole]

    def get(self, request):
        period = request.query_params.get('period', '30d')
        return Response(TransactionMetricsService.get_global_metrics(period))


class BillingReportView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser, IsAdminRole]

    def get(self, request):
        now   = timezone.now()
        year  = int(request.query_params.get('year',  now.year))
        month = int(request.query_params.get('month', now.month))
        fmt   = request.query_params.get('format', 'json')

        data = TransactionMetricsService.get_billing_report(year, month)
        for row in data:
            row['volume']    = row['volume'] or 0
            row['fee_cents'] = int(row['volume'] * 0.05)

        if fmt == 'csv':
            response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
            response['Content-Disposition'] = f'attachment; filename="faturamento_{year}_{month:02d}.csv"'
            writer = csv.DictWriter(
                response,
                fieldnames=['full_name', 'email', 'tx_count', 'volume', 'fee_cents']
            )
            writer.writeheader()
            writer.writerows(data)
            return response

        return Response({'year': year, 'month': month, 'users': data})
```

---

### Fase 6 — White Label

**Duração estimada: 2–3 dias**

```python
# white_label/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, JSONParser
from core.permissions import IsAdminRole
from .models import WhiteLabelConfig
from .serializers import WhiteLabelSerializer

class WhiteLabelPublicView(APIView):
    """Pública — necessária para renderizar o login antes de autenticar."""
    permission_classes = [AllowAny]

    def get(self, request):
        config = WhiteLabelConfig.objects.first()
        if not config:
            return Response({'brand_name': 'Share', 'primary_color': '#1E3A5F',
                             'secondary_color': '#FFFFFF', 'logo_url': None})
        return Response(WhiteLabelSerializer(config).data)


class WhiteLabelAdminView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    parser_classes     = [MultiPartParser, JSONParser]

    def patch(self, request):
        config, _ = WhiteLabelConfig.objects.get_or_create(pk=1)
        serializer = WhiteLabelSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        from audit_logs.service import AuditLogService
        AuditLogService.log(
            actor=request.user, action='white_label.updated',
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )
        return Response(serializer.data)
```

---

### Fase 7 — Audit Log & Notificações

**Duração estimada: 2–3 dias**

#### 7.1 — AuditLogService

```python
# audit_logs/service.py
import logging
from .models import AuditLog

logger = logging.getLogger(__name__)

class AuditLogService:
    @staticmethod
    def log(action: str, ip_address: str, user_agent: str = '',
            actor=None, target_type: str = None, target_id=None,
            metadata: dict = None) -> None:
        """
        Registra uma ação no audit log.
        Silencioso em caso de falha — nunca interrompe o fluxo principal.
        """
        try:
            AuditLog.objects.create(
                actor=actor,
                actor_role=actor.role if actor else '',
                action=action,
                target_type=target_type,
                target_id=target_id,
                metadata=metadata,
                ip_address=ip_address or '0.0.0.0',
                user_agent=user_agent,
            )
        except Exception as e:
            logger.error(f'AuditLog write failed: {e}')
```

**Ações que devem ser registradas:**

| Ação | Trigger |
|------|---------|
| `auth.login` | Login bem-sucedido |
| `auth.login_failed` | Credenciais incorretas |
| `auth.logout` | Logout |
| `user.created` | Admin cria usuário |
| `user.updated` | Admin edita usuário |
| `user.blocked` | Admin bloqueia usuário |
| `user.unblocked` | Admin desbloqueia |
| `user.deleted` | Soft delete |
| `user.notice_set` | Admin define aviso |
| `stripe.account_linked` | Usuário vincula conta Stripe |
| `stripe.account_removed` | Admin remove credenciais |
| `transaction.created` | Transação iniciada |
| `transaction.succeeded` | Pagamento aprovado |
| `transaction.failed` | Pagamento recusado |
| `white_label.updated` | Configuração white label alterada |

#### 7.2 — Celery Beat — Detecção de Anomalias

```python
# notifications/tasks.py
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.db import models as db_models
from transactions.models import Transaction
from users.models import User

@shared_task
def check_anomalies():
    """Executa a cada hora. Detecta padrões suspeitos e salva alertas."""
    now = timezone.now()

    # Usuários sem transação há 30 dias
    inactive_threshold = now - timedelta(days=30)
    inactive_ids = User.objects.filter(
        role='user', is_active=True, deleted_at__isnull=True,
    ).exclude(
        transactions__created_at__gte=inactive_threshold
    ).values_list('id', flat=True)

    # Transações de valor 5x acima do ticket médio do usuário
    recent_window = now - timedelta(minutes=5)
    anomalies = Transaction.objects.filter(
        created_at__gte=recent_window, status='succeeded'
    ).annotate(
        user_avg=db_models.Subquery(
            Transaction.objects.filter(
                user=db_models.OuterRef('user'), status='succeeded'
            ).values('user').annotate(a=db_models.Avg('amount')).values('a')[:1]
        )
    ).filter(amount__gt=db_models.F('user_avg') * 5)

    _save_alerts(list(inactive_ids), list(anomalies.values('id', 'user_id', 'amount')))

def _save_alerts(inactive_user_ids, anomaly_txs):
    from .models import Notification
    for uid in inactive_user_ids:
        Notification.objects.get_or_create(
            type='user_inactive', reference_id=str(uid),
            defaults={'is_read': False, 'created_at': timezone.now()}
        )
    for tx in anomaly_txs:
        Notification.objects.get_or_create(
            type='high_volume_tx', reference_id=str(tx['id']),
            defaults={'metadata': tx, 'is_read': False}
        )
```

```python
# config/celery.py
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('sharepos')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'check-anomalies-hourly': {
        'task':     'notifications.tasks.check_anomalies',
        'schedule': crontab(minute=0),
    },
}
```

---

### Fase 8 — Hardening & QA

**Duração estimada: 3–4 dias**

#### 8.1 — Testes Django

```python
# transactions/tests/test_pos_flow.py
from django.test import TestCase
from rest_framework.test import APIClient
from unittest.mock import patch, MagicMock
from users.models import User
from stripe_accounts.models import StripeAccount
from core.crypto import encrypt

class POSFlowTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user   = User.objects.create_user(
            email='user@test.com', password='Senha@123', role='user'
        )
        self.account = StripeAccount.objects.create(
            user=self.user,
            publishable_key='pk_test_xxx',
            secret_key_encrypted=encrypt('sk_test_xxx'),
            is_active=True,
        )
        r = self.client.post('/api/auth/login/', {'email': 'user@test.com', 'password': 'Senha@123'})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")

    @patch('stripe_accounts.stripe_service.StripeService.create_payment_intent')
    def test_create_transaction(self, mock_create):
        mock_create.return_value = MagicMock(id='pi_test_123')
        r = self.client.post('/api/transactions/', {'amount': 5000})
        self.assertEqual(r.status_code, 201)
        self.assertIn('transaction_id', r.data)

    @patch('stripe_accounts.stripe_service.StripeService.confirm_payment_intent')
    @patch('stripe_accounts.stripe_service.StripeService.create_payment_intent')
    def test_confirm_succeeded(self, mock_create, mock_confirm):
        mock_create.return_value = MagicMock(id='pi_123')
        pi = MagicMock()
        pi.status = 'succeeded'
        pi.payment_method_details.card.last4 = '4242'
        pi.payment_method_details.card.brand = 'visa'
        mock_confirm.return_value = pi

        tx_id = self.client.post('/api/transactions/', {'amount': 5000}).data['transaction_id']
        r     = self.client.post(f'/api/transactions/{tx_id}/confirm/', {
            'card_number': '4242424242424242', 'exp_month': 12, 'exp_year': 2026, 'cvc': '123'
        })
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['status'], 'succeeded')

    def test_blocked_user_returns_403(self):
        self.user.is_active = False
        self.user.save()
        from django.core.cache import cache
        cache.delete(f'user_active:{self.user.id}')
        r = self.client.get('/api/auth/me/')
        self.assertEqual(r.status_code, 403)

    def test_user_cannot_access_other_transaction(self):
        other = User.objects.create_user(email='other@test.com', password='x', role='user')
        # Buscar transação de outro usuário deve retornar 404
        r = self.client.get('/api/transactions/00000000-0000-0000-0000-000000000000/status/')
        self.assertEqual(r.status_code, 404)
```

#### 8.2 — Índices via Migration

```python
# migrations/0003_add_indexes.py
from django.db import migrations

class Migration(migrations.Migration):
    operations = [
        migrations.RunSQL("""
            CREATE INDEX CONCURRENTLY IF NOT EXISTS
              idx_transactions_user_created ON transactions(user_id, created_at DESC);
            CREATE INDEX CONCURRENTLY IF NOT EXISTS
              idx_transactions_status ON transactions(status);
            CREATE INDEX CONCURRENTLY IF NOT EXISTS
              idx_audit_logs_action_date ON audit_logs(action, created_at DESC);
            CREATE INDEX CONCURRENTLY IF NOT EXISTS
              idx_stripe_accounts_user_active ON stripe_accounts(user_id, is_active);
        """)
    ]
```

#### 8.3 — Health Check

```python
# core/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db import connection
from django.core.cache import cache

class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        checks = {}
        try:
            connection.ensure_connection()
            checks['database'] = 'ok'
        except Exception:
            checks['database'] = 'error'
        try:
            cache.set('health_check', '1', timeout=5)
            checks['redis'] = 'ok'
        except Exception:
            checks['redis'] = 'error'
        status_code = 200 if all(v == 'ok' for v in checks.values()) else 503
        return Response({'status': checks}, status=status_code)
```

---

## 5. Estrutura de Pastas

```
sharepos/
├── config/
│   ├── settings.py
│   ├── settings_test.py        # SQLite em memória para testes
│   ├── urls.py
│   ├── celery.py
│   └── wsgi.py
│
├── core/
│   ├── crypto.py               # AES-256-GCM encrypt/decrypt
│   ├── permissions.py          # IsAdminRole, IsActiveUser, IsOwnerOrAdmin
│   ├── middleware.py           # RLSMiddleware, ActiveUserCheckMiddleware
│   ├── pagination.py           # StandardPagination (cursor-based)
│   ├── exceptions.py           # custom_exception_handler
│   ├── logging.py              # MaskSensitiveFilter
│   └── views.py                # HealthCheckView
│
├── users/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py                # AdminUserViewSet
│   ├── urls.py
│   └── management/commands/
│       └── createsuperuser_admin.py
│
├── auth/
│   ├── serializers.py          # CustomTokenObtainPairSerializer
│   ├── views.py                # Login, Logout, Me
│   └── urls.py
│
├── stripe_accounts/
│   ├── models.py
│   ├── serializers.py
│   ├── stripe_service.py       # toda a comunicação com a Stripe API
│   ├── views.py
│   └── urls.py
│
├── transactions/
│   ├── models.py
│   ├── serializers.py
│   ├── services.py             # TransactionMetricsService
│   ├── views.py                # Create, Confirm, Status, List
│   ├── urls.py
│   └── tests/
│       └── test_pos_flow.py
│
├── admin_dashboard/
│   ├── views.py                # Summary, Chart, BillingReport
│   └── urls.py
│
├── audit_logs/
│   ├── models.py
│   ├── serializers.py
│   ├── service.py              # AuditLogService (injetado, não é uma view)
│   ├── views.py                # leitura somente para o Admin
│   └── urls.py
│
├── notifications/
│   ├── models.py
│   ├── tasks.py                # Celery tasks (check_anomalies)
│   ├── views.py
│   └── urls.py
│
├── white_label/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
│
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── manage.py
```

---

## 6. Contratos de API

### URLs Completas

```
POST   /api/auth/login/
POST   /api/auth/refresh/
POST   /api/auth/logout/
GET    /api/auth/me/

GET    /api/stripe/accounts/
POST   /api/stripe/accounts/

POST   /api/transactions/
POST   /api/transactions/:id/confirm/
GET    /api/transactions/:id/status/
GET    /api/transactions/

GET    /api/admin/users/
POST   /api/admin/users/
GET    /api/admin/users/:id/
PATCH  /api/admin/users/:id/
DELETE /api/admin/users/:id/
PATCH  /api/admin/users/:id/block/
PATCH  /api/admin/users/:id/unblock/
GET    /api/admin/users/:id/metrics/

GET    /api/admin/dashboard/summary/
GET    /api/admin/dashboard/chart/
GET    /api/admin/reports/billing/
GET    /api/admin/audit-log/
GET    /api/admin/notifications/

GET    /api/config/white-label/
PATCH  /api/admin/white-label/

GET    /api/health/
```

### Exemplos de Resposta

**Transação confirmada:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 15000,
  "status": "succeeded",
  "card_last4": "4242",
  "card_brand": "visa",
  "payment_method": "card_digital",
  "created_at": "2025-03-15T14:32:00Z"
}
```

**Métricas do dashboard:**
```json
{
  "period": {"start": "2025-03-01T00:00:00Z", "end": "2025-03-31T23:59:59Z"},
  "total_volume_cents": 4872300,
  "transaction_count": 342,
  "average_ticket_cents": 14246,
  "approval_rate": 0.94,
  "active_users_count": 12
}
```

**Erro padrão:**
```json
{
  "detail": "Credenciais Stripe inválidas ou conta inativa.",
  "code": "stripe_invalid_credentials"
}
```

---

## 7. Checklist de Entrega MVP

### Backend Django
- [ ] Models com soft delete em `User`
- [ ] RLS habilitado via migration raw + `RLSMiddleware`
- [ ] `ActiveUserCheckMiddleware` com cache Redis (TTL 60s)
- [ ] `CustomTokenObtainPairSerializer` com role/nome no JWT
- [ ] Refresh token rotation + blacklist (simplejwt)
- [ ] `django-axes` configurado (bloqueio após 5 tentativas)
- [ ] `core/crypto.py` com AES-256-GCM
- [ ] `StripeService` sem estado em memória — sk nunca persiste
- [ ] Validação das credenciais Stripe antes de salvar
- [ ] CRUD de usuários com soft delete, bloquear/desbloquear + audit log
- [ ] Invalidação de cache ao bloquear usuário
- [ ] Fluxo de transação: criar → confirmar → polling
- [ ] Tratamento de `stripe.CardError` com mensagens em PT-BR
- [ ] Rejeição de 3DS com mensagem clara
- [ ] `TransactionMetricsService` com cache Redis (TTL 60s)
- [ ] Relatório de cobrança (5%) com exportação CSV
- [ ] Celery Beat — `check_anomalies` a cada hora
- [ ] `AuditLogService` em todas as ações críticas
- [ ] White label — endpoint público + admin com upload de logo
- [ ] Health check com banco e Redis
- [ ] Sentry configurado
- [ ] `MaskSensitiveFilter` no LOGGING
- [ ] Testes cobrindo POS completo e bloqueio de usuário
- [ ] Índices nas colunas críticas
- [ ] `DEBUG=False` e headers de segurança em produção
- [ ] `pip-audit` sem vulnerabilidades críticas

### Frontend (Next.js)
- [ ] Tela de login com mensagem de bloqueio (`notice_message`)
- [ ] Interceptor com refresh automático de token
- [ ] Fluxo POS em 4 passos (valor → método → cartão → resultado)
- [ ] Polling com timeout de 30 segundos
- [ ] Histórico de transações com filtros
- [ ] Configuração de conta Stripe
- [ ] Dashboard admin com gráficos e seletor de período
- [ ] Gestão de usuários (lista + detalhe com métricas)
- [ ] Relatório de cobrança com exportação CSV
- [ ] Audit log (somente leitura)
- [ ] White Label com preview em tempo real
- [ ] Proteção de rotas por role (middleware Next.js)
- [ ] Layout responsivo para mobile

### Infraestrutura
- [ ] HTTPS + HSTS configurados
- [ ] Banco acessível apenas via rede privada
- [ ] Variáveis sensíveis em secrets manager
- [ ] CI com flake8, testes e pip-audit
- [ ] Monitoramento de uptime externo

---

*Este documento é a fonte de verdade técnica do projeto. Qualquer decisão que contrarie as diretrizes de segurança aqui descritas deve ser discutida e documentada antes de ser implementada.*
