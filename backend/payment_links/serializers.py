from django.conf import settings
from rest_framework import serializers
from .models import PaymentLink


class PaymentLinkSerializer(serializers.ModelSerializer):
    amount_brl = serializers.SerializerMethodField()
    payment_url = serializers.SerializerMethodField()

    class Meta:
        model = PaymentLink
        fields = [
            'id', 'title', 'amount', 'amount_brl', 'status', 'slug',
            'payment_url', 'card_last4', 'card_brand', 'paid_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'card_last4', 'card_brand', 'paid_at', 'created_at', 'updated_at']

    def get_amount_brl(self, obj):
        return f"R$ {obj.amount / 100:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')

    def get_payment_url(self, obj):
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000').rstrip('/')
        return f'{frontend_url}/pay/{obj.slug}'


class CreatePaymentLinkSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    amount = serializers.IntegerField(min_value=100, max_value=99999999, help_text='Amount in cents')


class UpdatePaymentLinkSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[
        PaymentLink.STATUS_ACTIVE,
        PaymentLink.STATUS_INACTIVE,
        PaymentLink.STATUS_PAID,
    ])


class PublicPaymentLinkSerializer(serializers.Serializer):
    title = serializers.CharField()
    amount = serializers.IntegerField()
    amount_brl = serializers.SerializerMethodField()
    publishable_key = serializers.CharField()
    client_secret = serializers.CharField()

    def get_amount_brl(self, obj):
        amount = obj.get('amount', 0)
        return f"R$ {amount / 100:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')


class ConfirmPaymentSerializer(serializers.Serializer):
    payment_intent_id = serializers.CharField(max_length=200)
