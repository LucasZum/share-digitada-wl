import secrets
import string
from rest_framework import serializers
from .models import User


def generate_temp_password(length=12) -> str:
    alphabet = string.ascii_letters + string.digits + '!@#$%'
    while True:
        pwd = ''.join(secrets.choice(alphabet) for _ in range(length))
        has_upper = any(c.isupper() for c in pwd)
        has_lower = any(c.islower() for c in pwd)
        has_digit = any(c.isdigit() for c in pwd)
        has_special = any(c in '!@#$%' for c in pwd)
        if has_upper and has_lower and has_digit and has_special:
            return pwd


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role', 'is_active', 'notice_message',
                  'must_change_password', 'terms_accepted', 'payment_links_enabled', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CreateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'full_name', 'role']

    def create(self, validated_data):
        temp_password = generate_temp_password()
        user = User.objects.create_user(
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            password=temp_password,
            role=validated_data.get('role', 'user'),
            must_change_password=True,
        )
        user._temp_password = temp_password
        return user


class UpdateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['full_name', 'role']


class BlockUserSerializer(serializers.Serializer):
    notice_message = serializers.CharField(required=False, allow_blank=True, default='')
