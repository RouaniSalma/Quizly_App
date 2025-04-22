from django.core.management.base import BaseCommand
from users.models import User

class Command(BaseCommand):
    help = 'Crée un superadmin'

    def handle(self, *args, **options):
        User.objects.create_superuser(
            username='admin',
            email='admin@ecole.fr',
            password='admin123',
            role='ADMIN'
        )
        self.stdout.write("Superadmin créé !")