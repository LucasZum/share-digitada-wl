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
    amount = serializers.IntegerField(min_value=100, max_value=99999999, help_text='Amount in cents')


