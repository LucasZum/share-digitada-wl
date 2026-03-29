from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from core.permissions import IsActiveUser
from audit_logs.service import AuditLogService
from core.crypto import encrypt
from .models import StripeAccount
from .serializers import StripeAccountSerializer, LinkStripeAccountSerializer
from . import stripe_service


class StripeAccountListCreateView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsActiveUser]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return LinkStripeAccountSerializer
        return StripeAccountSerializer

    def get(self, request):
        accounts = StripeAccount.objects.filter(user=request.user).order_by('-created_at')
        serializer = StripeAccountSerializer(accounts, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = LinkStripeAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        pk = serializer.validated_data['publishable_key']
        sk = serializer.validated_data['secret_key']

        try:
            stripe_service.validate_credentials(pk, sk)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        info = stripe_service.get_account_info(sk)

        # Deactivate existing active accounts
        now = timezone.now()
        StripeAccount.objects.filter(user=request.user, is_active=True).update(
            is_active=False, deactivated_at=now
        )

        account = StripeAccount.objects.create(
            user=request.user,
            publishable_key=pk,
            secret_key_encrypted=encrypt(sk),
            stripe_account_id=info.get('stripe_account_id', ''),
            account_name=info.get('account_name', ''),
            account_email=info.get('account_email', ''),
            charges_enabled=info.get('charges_enabled', False),
        )

        AuditLogService.log(
            actor=request.user,
            action='stripe.account_linked',
            target_type='stripe_account',
            target_id=str(account.id),
            metadata={'publishable_key_suffix': pk[-8:]},
            request=request,
        )

        return Response(StripeAccountSerializer(account).data, status=status.HTTP_201_CREATED)
