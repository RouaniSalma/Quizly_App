from django.db.models.signals import post_save
from django.dispatch import receiver
from student_space.models import Quiz  # Adaptez au chemin réel
from .models import SharedQuizAccess

@receiver(post_save, sender=Quiz)
def create_shared_access(sender, instance, created, **kwargs):
    if created and not instance.is_generated:
        # Ne créer un accès partagé que pour les quiz non-générés (quiz créés manuellement)
        # Ici, associez le quiz à tous les users ou à des groupes spécifiques
        # Exemple simplifié : créez un accès pour le superuser
        from django.contrib.auth import get_user_model
        User = get_user_model()
        admin = User.objects.filter(is_superuser=True).first()
        if admin:
            SharedQuizAccess.objects.create(quiz=instance, student=admin)