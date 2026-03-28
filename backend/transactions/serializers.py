from rest_framework import serializers
from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    amount_brl = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id', 'amount', 'amount_brl', 'currency', 'status',
            'payment_method', 'card_last4', 'card_brand',
            'error_message', 'created_at', 'updated_at',
        ]

    def get_amount_brl(self, obj):
        return f"R$ {obj.amount / 100:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')


class CreateTransactionSerializer(serializers.Serializer):
    amount = serializers.IntegerField(min_value=100, max_value=9999900, help_text='Amount in cents')


class ConfirmTransactionSerializer(serializers.Serializer):
    card_number = serializers.CharField(min_length=13, max_length=19)
    exp_month = serializers.IntegerField(min_value=1, max_value=12)
    exp_year = serializers.IntegerField(min_value=2024, max_value=2040)
    cvc = serializers.CharField(min_length=3, max_length=4)

    def validate_card_number(self, value):
        digits = value.replace(' ', '').replace('-', '')
        if not digits.isdigit():
            raise serializers.ValidationError('Número do cartão inválido.')
        return digits
