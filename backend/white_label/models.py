import uuid
from django.db import models
from django.conf import settings


class WhiteLabelConfig(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    logo = models.ImageField(upload_to='white_label/', null=True, blank=True)
    primary_color = models.CharField(max_length=7, default='#1E3A5F')
    secondary_color = models.CharField(max_length=7, default='#FFFFFF')
    brand_name = models.CharField(max_length=100, default='Share')
    custom_domain = models.CharField(max_length=200, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='+',
    )

    class Meta:
        db_table = 'white_label_config'

    @classmethod
    def get_config(cls):
        obj, _ = cls.objects.get_or_create(
            pk='00000000-0000-0000-0000-000000000001',
            defaults={
                'primary_color': '#1E3A5F',
                'secondary_color': '#FFFFFF',
                'brand_name': 'Share',
            }
        )
        return obj
