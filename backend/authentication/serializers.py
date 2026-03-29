from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['full_name'] = user.full_name
        token['email'] = user.email
        token['must_change_password'] = user.must_change_password
        token['terms_accepted'] = user.terms_accepted
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        if not user.is_active:
            notice = user.notice_message or 'Sua conta está suspensa. Entre em contato com o administrador.'
            raise serializers.ValidationError({'detail': notice, 'code': 'account_inactive'})
        return data
