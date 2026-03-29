from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stripe_accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='stripeaccount',
            name='account_name',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='stripeaccount',
            name='account_email',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='stripeaccount',
            name='charges_enabled',
            field=models.BooleanField(default=False),
        ),
    ]
