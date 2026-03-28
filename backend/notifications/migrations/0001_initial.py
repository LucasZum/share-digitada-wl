import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('type', models.CharField(choices=[
                    ('user_inactive', 'Usuário Inativo'),
                    ('high_volume_tx', 'Alto Volume de Transações'),
                ], db_index=True, max_length=30)),
                ('reference_id', models.UUIDField(blank=True, null=True)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('is_read', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'db_table': 'notifications', 'ordering': ['-created_at']},
        ),
    ]
