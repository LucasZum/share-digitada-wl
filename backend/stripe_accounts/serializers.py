from rest_framework import serializers
from .models import StripeAccount


class StripeAccountSerializer(serializers.ModelSerializer):
    publishable_key_suffix = serializers.SerializerMethodField()

    class Meta:
        model = StripeAccount
        fields = [
            'id', 'publishable_key_suffix', 'is_active',
            'activated_at', 'deactivated_at', 'created_at',
        ]

    def get_publishable_key_suffix(self, obj):
        key = obj.publishable_key
        return f"...{key[-8:]}" if len(key) > 8 else key


class LinkStripeAccountSerializer(serializers.Serializer):
    publishable_key = serializers.CharField()
    secret_key = serializers.CharField()

    def validate_publishable_key(self, value):
        if not value.startswith(('pk_live_', 'pk_test_')):
            raise serializers.ValidationError('Deve começar com pk_live_ ou pk_test_.')
        return value

    def validate_secret_key(self, value):
        if not value.startswith(('sk_live_', 'sk_test_')):
            raise serializers.ValidationError('Deve começar com sk_live_ ou sk_test_.')
        return value
