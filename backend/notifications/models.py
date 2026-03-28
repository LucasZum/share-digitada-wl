import uuid
from django.db import models


class Notification(models.Model):
    TYPE_CHOICES = [
        ('user_inactive', 'Usuário Inativo'),
        ('high_volume_tx', 'Alto Volume de Transações'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=30, choices=TYPE_CHOICES, db_index=True)
    reference_id = models.UUIDField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
