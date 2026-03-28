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
            name='WhiteLabelConfig',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('logo', models.ImageField(blank=True, null=True, upload_to='white_label/')),
                ('primary_color', models.CharField(default='#1E3A5F', max_length=7)),
                ('secondary_color', models.CharField(default='#FFFFFF', max_length=7)),
                ('brand_name', models.CharField(default='Share', max_length=100)),
                ('custom_domain', models.CharField(blank=True, max_length=200)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('updated_by', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='+',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'white_label_config'},
        ),
    ]
