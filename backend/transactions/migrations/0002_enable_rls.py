from django.db import migrations


class Migration(migrations.Migration):
    """
    Enables PostgreSQL Row-Level Security on transactions and stripe_accounts tables.
    atomic=False because RLS DDL cannot run inside a transaction in all PG versions.
    Skipped automatically when running on SQLite (test environment).
    """

    atomic = False

    dependencies = [
        ('transactions', '0001_initial'),
        ('stripe_accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            -- Enable RLS on transactions
            ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
            ALTER TABLE transactions FORCE ROW LEVEL SECURITY;

            -- Enable RLS on stripe_accounts
            ALTER TABLE stripe_accounts ENABLE ROW LEVEL SECURITY;
            ALTER TABLE stripe_accounts FORCE ROW LEVEL SECURITY;

            -- Policy: users see only their transactions; admins see all
            DROP POLICY IF EXISTS user_transactions ON transactions;
            CREATE POLICY user_transactions ON transactions
                USING (
                    current_setting('app.current_role', TRUE) = 'admin'
                    OR user_id::text = current_setting('app.current_user_id', TRUE)
                );

            -- Policy: users see only their stripe accounts; admins see all
            DROP POLICY IF EXISTS user_stripe_accounts ON stripe_accounts;
            CREATE POLICY user_stripe_accounts ON stripe_accounts
                USING (
                    current_setting('app.current_role', TRUE) = 'admin'
                    OR user_id::text = current_setting('app.current_user_id', TRUE)
                );
            """,
            reverse_sql="""
            ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
            ALTER TABLE stripe_accounts DISABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS user_transactions ON transactions;
            DROP POLICY IF EXISTS user_stripe_accounts ON stripe_accounts;
            """,
            hints={'django_db_migration': True},
        ),
    ]

    def apply(self, project_state, schema_editor, collect_sql=False):
        if schema_editor.connection.vendor != 'postgresql':
            return project_state
        return super().apply(project_state, schema_editor, collect_sql)

    def unapply(self, project_state, schema_editor, collect_sql=False):
        if schema_editor.connection.vendor != 'postgresql':
            return project_state
        return super().unapply(project_state, schema_editor, collect_sql)
