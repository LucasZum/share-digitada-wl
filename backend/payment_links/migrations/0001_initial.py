import uuid
import payment_links.models
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('stripe_accounts', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='PaymentLink',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=200)),
                ('amount', models.PositiveIntegerField(help_text='Amount in cents (BRL)')),
                ('status', models.CharField(
                    choices=[('active', 'Ativo'), ('inactive', 'Inativo'), ('paid', 'Pago')],
                    db_index=True,
                    default='active',
                    max_length=20,
                )),
                ('slug', models.CharField(
                    db_index=True,
                    default=payment_links.models.generate_slug,
                    max_length=16,
                    unique=True,
                )),
                ('stripe_payment_intent_id', models.CharField(blank=True, max_length=200)),
                ('card_last4', models.CharField(blank=True, max_length=4)),
                ('card_brand', models.CharField(blank=True, max_length=20)),
                ('paid_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='payment_links',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('stripe_account', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='payment_links',
                    to='stripe_accounts.stripeaccount',
                )),
            ],
            options={'db_table': 'payment_links', 'ordering': ['-created_at']},
        ),
        migrations.AddIndex(
            model_name='paymentlink',
            index=models.Index(fields=['user', '-created_at'], name='idx_pl_user_created'),
        ),
    ]
