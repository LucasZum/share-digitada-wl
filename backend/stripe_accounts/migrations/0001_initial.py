import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='StripeAccount',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('publishable_key', models.CharField(max_length=200)),
                ('secret_key_encrypted', models.TextField()),
                ('stripe_account_id', models.CharField(blank=True, max_length=100)),
                ('is_active', models.BooleanField(default=True)),
                ('activated_at', models.DateTimeField(auto_now_add=True)),
                ('deactivated_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='stripe_accounts',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'stripe_accounts', 'ordering': ['-created_at']},
        ),
    ]
