from rest_framework import serializers
from .models import WhiteLabelConfig


class WhiteLabelSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = WhiteLabelConfig
        fields = ['primary_color', 'secondary_color', 'brand_name', 'custom_domain', 'logo_url', 'updated_at']

    def get_logo_url(self, obj):
        if not obj.logo:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.logo.url)
        return obj.logo.url


class WhiteLabelUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WhiteLabelConfig
        fields = ['logo', 'primary_color', 'secondary_color', 'brand_name', 'custom_domain']
