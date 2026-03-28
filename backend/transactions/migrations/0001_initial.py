import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0001_initial'),
        ('stripe_accounts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Transaction',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('stripe_payment_intent_id', models.CharField(db_index=True, max_length=200)),
                ('amount', models.PositiveIntegerField()),
                ('currency', models.CharField(default='brl', max_length=3)),
                ('status', models.CharField(choices=[
                    ('pending', 'Pendente'), ('processing', 'Processando'),
                    ('succeeded', 'Aprovado'), ('failed', 'Recusado'), ('canceled', 'Cancelado'),
                ], db_index=True, default='pending', max_length=20)),
                ('payment_method', models.CharField(choices=[
                    ('card_digital', 'Venda Digitada'), ('card_present', 'Cartão Presente'),
                ], default='card_digital', max_length=20)),
                ('card_last4', models.CharField(blank=True, max_length=4)),
                ('card_brand', models.CharField(blank=True, max_length=20)),
                ('error_message', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='transactions',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('stripe_account', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='transactions',
                    to='stripe_accounts.stripeaccount',
                )),
            ],
            options={'db_table': 'transactions', 'ordering': ['-created_at']},
        ),
        migrations.AddIndex(
            model_name='transaction',
            index=models.Index(fields=['user', '-created_at'], name='idx_tx_user_created'),
        ),
        migrations.AddIndex(
            model_name='transaction',
            index=models.Index(fields=['status'], name='idx_tx_status'),
        ),
    ]
