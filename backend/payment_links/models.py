import uuid
import secrets
from django.db import models
from django.conf import settings


def generate_slug():
    """Generate a unique 12-char URL-safe slug."""
    return secrets.token_urlsafe(9)


class PaymentLink(models.Model):
    STATUS_ACTIVE = 'active'
    STATUS_INACTIVE = 'inactive'
    STATUS_PAID = 'paid'

    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Ativo'),
        (STATUS_INACTIVE, 'Inativo'),
        (STATUS_PAID, 'Pago'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payment_links',
    )
    stripe_account = models.ForeignKey(
        'stripe_accounts.StripeAccount',
        on_delete=models.PROTECT,
        related_name='payment_links',
        null=True,
        blank=True,
        default=None,
    )
    title = models.CharField(max_length=200)
    amount = models.PositiveIntegerField(help_text='Amount in cents (BRL)')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE, db_index=True)
    slug = models.CharField(max_length=16, unique=True, db_index=True, default=generate_slug)

    # Populated after payment
    stripe_payment_intent_id = models.CharField(max_length=200, blank=True)
    card_last4 = models.CharField(max_length=4, blank=True)
    card_brand = models.CharField(max_length=20, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payment_links'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at'], name='idx_pl_user_created'),
        ]

    def __str__(self):
        return f"{self.title} — R${self.amount / 100:.2f} — {self.status}"
