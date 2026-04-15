from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('payment_links', '0002_paymentlink_stripe_account_nullable'),
    ]

    operations = [
        migrations.RunSQL(
            sql='ALTER TABLE payment_links ALTER COLUMN stripe_checkout_session_id DROP NOT NULL;',
            reverse_sql='ALTER TABLE payment_links ALTER COLUMN stripe_checkout_session_id SET NOT NULL;',
        ),
    ]
