import uuid
from django.db import models
from django.conf import settings


class StripeAccount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='stripe_accounts',
    )
    publishable_key = models.CharField(max_length=200)
    secret_key_encrypted = models.TextField()
    stripe_account_id = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    activated_at = models.DateTimeField(auto_now_add=True)
    deactivated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stripe_accounts'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} — {self.publishable_key[:20]}..."
