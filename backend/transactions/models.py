import uuid
from django.db import models
from django.conf import settings


class Transaction(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('processing', 'Processando'),
        ('succeeded', 'Aprovado'),
        ('failed', 'Recusado'),
        ('canceled', 'Cancelado'),
    ]
    METHOD_CHOICES = [
        ('card_digital', 'Venda Digitada'),
        ('card_present', 'Cartão Presente'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='transactions',
    )
    stripe_account = models.ForeignKey(
        'stripe_accounts.StripeAccount',
        on_delete=models.PROTECT,
        related_name='transactions',
    )
    stripe_payment_intent_id = models.CharField(max_length=200, db_index=True)
    amount = models.PositiveIntegerField(help_text='Amount in cents (BRL)')
    currency = models.CharField(max_length=3, default='brl')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='card_digital')
    card_last4 = models.CharField(max_length=4, blank=True)
    card_brand = models.CharField(max_length=20, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at'], name='idx_tx_user_created'),
            models.Index(fields=['status'], name='idx_tx_status'),
        ]

    def __str__(self):
        return f"{self.id} — {self.status} — R${self.amount / 100:.2f}"
