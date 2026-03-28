import secrets
import string
from django.core.management.base import BaseCommand
from users.models import User


class Command(BaseCommand):
    help = 'Create the initial Share POS admin user'

    def add_arguments(self, parser):
        parser.add_argument('--email', required=True)
        parser.add_argument('--name', default='Admin')
        parser.add_argument('--password', default=None)

    def handle(self, *args, **options):
        email = options['email']
        name = options['name']
        password = options['password']

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f'Admin {email} already exists.'))
            return

        if not password:
            alphabet = string.ascii_letters + string.digits + '!@#$%'
            password = ''.join(secrets.choice(alphabet) for _ in range(16))

        user = User.objects.create_user(
            email=email,
            full_name=name,
            password=password,
            role='admin',
        )
        user.is_staff = True
        user.is_superuser = True
        user.save()

        self.stdout.write(self.style.SUCCESS(f'Admin created: {email}'))
        self.stdout.write(self.style.SUCCESS(f'Password: {password}'))
        self.stdout.write(self.style.WARNING('Save this password — it will not be shown again.'))
