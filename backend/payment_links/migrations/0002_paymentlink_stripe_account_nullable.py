from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('payment_links', '0001_initial'),
        ('stripe_accounts', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='paymentlink',
            name='stripe_account',
            field=models.ForeignKey(
                blank=True,
                default=None,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='payment_links',
                to='stripe_accounts.stripeaccount',
            ),
        ),
    ]
