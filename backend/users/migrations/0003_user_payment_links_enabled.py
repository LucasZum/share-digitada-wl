from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_user_must_change_password_terms_accepted'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='payment_links_enabled',
            field=models.BooleanField(default=False),
        ),
    ]
