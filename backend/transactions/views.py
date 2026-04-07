import logging
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from core.permissions import IsActiveUser
from core.pagination import TransactionCursorPagination
from audit_logs.service import AuditLogService
from stripe_accounts.models import StripeAccount
from stripe_accounts import stripe_service
from .models import Transaction
from .serializers import TransactionSerializer, CreateTransactionSerializer

logger = logging.getLogger(__name__)


class TransactionCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsActiveUser]
    serializer_class = CreateTransactionSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        amount = serializer.validated_data['amount']

        try:
            account = StripeAccount.objects.get(user=request.user, is_active=True)
        except StripeAccount.DoesNotExist:
            return Response({'detail': 'Nenhuma conta Stripe ativa vinculada.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create transaction record first (idempotency key = UUID)
        tx = Transaction.objects.create(
            user=request.user,
            stripe_account=account,
            stripe_payment_intent_id='',  # filled after PI creation
            amount=amount,
            status='pending',
        )

        try:
            result = stripe_service.create_payment_intent(
                secret_key_encrypted=account.secret_key_encrypted,
                amount_cents=amount,
                idempotency_key=str(tx.id),
            )
            tx.stripe_payment_intent_id = result['id']
            tx.save(update_fields=['stripe_payment_intent_id'])
        except Exception as exc:
            tx.status = 'failed'
            tx.error_message = str(exc)
            tx.save(update_fields=['status', 'error_message'])
            return Response({'detail': 'Erro ao criar intenção de pagamento.'}, status=status.HTTP_502_BAD_GATEWAY)

        AuditLogService.log(
            actor=request.user,
            action='transaction.created',
            target_type='transaction',
            target_id=str(tx.id),
            metadata={'amount_cents': amount},
            request=request,
        )

        response_data = TransactionSerializer(tx).data
        response_data['client_secret'] = result['client_secret']
        response_data['publishable_key'] = account.publishable_key
        return Response(response_data, status=status.HTTP_201_CREATED)



class TransactionStatusView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser]

    def get(self, request, pk):
        try:
            tx = Transaction.objects.select_related('stripe_account').get(pk=pk, user=request.user)
        except Transaction.DoesNotExist:
            return Response({'detail': 'Transação não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        TERMINAL = {'succeeded', 'failed', 'canceled'}
        if tx.status not in TERMINAL:
            result = stripe_service.get_payment_intent_status(
                tx.stripe_account.secret_key_encrypted,
                tx.stripe_payment_intent_id,
            )
            stripe_status = result.get('status', '')
            if stripe_status == 'succeeded':
                tx.status = 'succeeded'
                tx.card_last4 = result.get('card_last4', '')
                tx.card_brand = result.get('card_brand', '')
                tx.save(update_fields=['status', 'card_last4', 'card_brand', 'updated_at'])
            elif stripe_status in ('canceled', 'failed'):
                tx.status = 'failed'
                tx.save(update_fields=['status', 'updated_at'])

        return Response(TransactionSerializer(tx).data)


class TransactionUpdateCustomerView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser]

    def patch(self, request, pk):
        tx = get_object_or_404(Transaction, pk=pk, user=request.user)
        cpf = request.data.get('cpf', '').replace('.', '').replace('-', '').strip()
        if cpf:
            try:
                stripe_service.update_payment_intent_metadata(
                    tx.stripe_account.secret_key_encrypted,
                    tx.stripe_payment_intent_id,
                    {'cpf': cpf},
                )
            except Exception as exc:
                logger.warning('Could not update PaymentIntent metadata: %s', exc)
        return Response({'ok': True})


class TransactionListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsActiveUser]
    serializer_class = TransactionSerializer
    pagination_class = TransactionCursorPagination

    def get_queryset(self):
        qs = Transaction.objects.filter(user=self.request.user)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        return qs
