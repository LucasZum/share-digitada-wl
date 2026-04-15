import logging
from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from core.permissions import IsActiveUser
from stripe_accounts import stripe_service
from .models import PaymentLink
from .serializers import (
    PaymentLinkSerializer,
    CreatePaymentLinkSerializer,
    UpdatePaymentLinkSerializer,
    ConfirmPaymentSerializer,
)

logger = logging.getLogger(__name__)


class PaymentLinkListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser]

    def _check_enabled(self, request):
        if not request.user.payment_links_enabled:
            return Response(
                {'detail': 'Links de pagamento não estão habilitados para sua conta.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    def get(self, request):
        denied = self._check_enabled(request)
        if denied:
            return denied
        links = PaymentLink.objects.filter(user=request.user)
        serializer = PaymentLinkSerializer(links, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        denied = self._check_enabled(request)
        if denied:
            return denied

        serializer = CreatePaymentLinkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        link = PaymentLink.objects.create(
            user=request.user,
            title=serializer.validated_data['title'],
            amount=serializer.validated_data['amount'],
        )
        return Response(
            PaymentLinkSerializer(link, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class PaymentLinkDetailView(APIView):
    permission_classes = [IsAuthenticated, IsActiveUser]

    def _get_link(self, request, pk):
        try:
            return PaymentLink.objects.get(pk=pk, user=request.user)
        except PaymentLink.DoesNotExist:
            return None

    def patch(self, request, pk):
        link = self._get_link(request, pk)
        if not link:
            return Response({'detail': 'Link não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdatePaymentLinkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']
        link.status = new_status
        if new_status == PaymentLink.STATUS_PAID and not link.paid_at:
            link.paid_at = timezone.now()
        link.save(update_fields=['status', 'paid_at', 'updated_at'])

        return Response(PaymentLinkSerializer(link, context={'request': request}).data)

    def delete(self, request, pk):
        link = self._get_link(request, pk)
        if not link:
            return Response({'detail': 'Link não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        link.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PublicPaymentLinkView(APIView):
    """No authentication required — called by the client's browser."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        try:
            link = PaymentLink.objects.get(slug=slug)
        except PaymentLink.DoesNotExist:
            return Response({'detail': 'Link não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if link.status == PaymentLink.STATUS_INACTIVE:
            return Response({'detail': 'Este link de pagamento está inativo.', 'status': 'inactive'}, status=status.HTTP_410_GONE)

        if link.status == PaymentLink.STATUS_PAID:
            return Response({'detail': 'Este link de pagamento já foi pago.', 'status': 'paid'}, status=status.HTTP_410_GONE)

        if not settings.STRIPE_SECRET_KEY or not settings.STRIPE_PUBLISHABLE_KEY:
            logger.error('Platform Stripe keys not configured.')
            return Response({'detail': 'Pagamento indisponível no momento. Tente novamente mais tarde.'}, status=status.HTTP_502_BAD_GATEWAY)

        try:
            result = stripe_service.create_payment_intent_platform(
                amount_cents=link.amount,
                link_id=str(link.id),
            )
        except Exception as exc:
            logger.error('Failed to create PaymentIntent for link %s: %s', link.id, exc)
            return Response({'detail': 'Erro ao preparar pagamento. Tente novamente.'}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({
            'title': link.title,
            'amount': link.amount,
            'publishable_key': settings.STRIPE_PUBLISHABLE_KEY,
            'client_secret': result['client_secret'],
        })


class PublicPaymentLinkConfirmView(APIView):
    """No authentication required — called by the client's browser after Stripe.js confirms."""
    permission_classes = [AllowAny]

    def post(self, request, slug):
        try:
            link = PaymentLink.objects.get(slug=slug)
        except PaymentLink.DoesNotExist:
            return Response({'detail': 'Link não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if link.status == PaymentLink.STATUS_PAID:
            return Response({'detail': 'Link já está marcado como pago.'})

        serializer = ConfirmPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pi_id = serializer.validated_data['payment_intent_id']

        result = stripe_service.verify_payment_intent_platform(
            payment_intent_id=pi_id,
        )

        if not result.get('succeeded'):
            return Response(
                {'detail': 'Pagamento não confirmado. Verifique os dados e tente novamente.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        link.status = PaymentLink.STATUS_PAID
        link.stripe_payment_intent_id = pi_id
        link.card_last4 = result.get('card_last4', '')
        link.card_brand = result.get('card_brand', '')
        link.paid_at = timezone.now()
        link.save(update_fields=['status', 'stripe_payment_intent_id', 'card_last4', 'card_brand', 'paid_at', 'updated_at'])

        return Response({'detail': 'Pagamento confirmado com sucesso.'})
