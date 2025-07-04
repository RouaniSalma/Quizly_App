from django.db import models
from auth_app.models import CustomUser


# Create your models here.
class Module(models.Model):
    name = models.CharField(max_length=100)
    normalized_name = models.CharField(max_length=100)  # Retirez unique=True
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='student_modules')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Ajoutez cette contrainte pour rendre unique la combinaison normalized_name + student
        constraints = [
            models.UniqueConstraint(
                fields=['normalized_name', 'student'],
                name='unique_module_per_student'
            )
        ]

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        self.normalized_name = self.name.lower().strip().replace(' ', '')
        super().save(*args, **kwargs)



class PDF(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="pdfs")
    titre = models.CharField(max_length=100)
    fichier = models.FileField(upload_to="pdfs/")
    date_upload = models.DateTimeField(auto_now_add=True)


class Quiz(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="quizzes")
    titre = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    is_generated = models.BooleanField(default=False)
    
    def __str__(self):
        return self.titre
    
class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    enonce = models.TextField()
    bonnes_reponses = models.ManyToManyField("Choix", related_name="questions_ou_je_suis_bonne_reponse")


# Choix de la reponse
class Choix(models.Model):
    question = models.ForeignKey("Question", on_delete=models.CASCADE, related_name="choix")
    texte = models.CharField(max_length=200)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.texte
    

from django.conf import settings


from django.core.exceptions import ValidationError
 

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class QuizResult(models.Model):
    quiz = models.ForeignKey('Quiz', on_delete=models.CASCADE)
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    score = models.IntegerField()
    total_questions = models.IntegerField()
    date_taken = models.DateTimeField(auto_now_add=True)
    answers = models.JSONField(default=list)  # Ajoutez ce champ

    def __str__(self):
        return f"{self.student.username} - {self.quiz.titre} - {self.score}/{self.total_questions}"

    def clean(self):
        """Validation pour s'assurer que le score est cohérent."""
        if self.score < 0:
            raise ValidationError("Le score ne peut pas être négatif.")
        if self.score > self.total_questions:
            raise ValidationError("Le score ne peut pas dépasser le nombre total de questions.")
        if self.total_questions <= 0:
            raise ValidationError("Le nombre total de questions doit être positif.")

    @property
    def percentage(self):
        """Calcule automatiquement le pourcentage de réussite."""
        return round((self.score / self.total_questions) * 100) if self.total_questions > 0 else 0

    def __str__(self):
        return f"{self.student.username} - {self.quiz.titre} - {self.score}/{self.total_questions}"
    ########### student passe quiz teacher

from django.db import models
from django.contrib.auth import get_user_model

import uuid

class SharedQuizAccess(models.Model):
    quiz = models.ForeignKey('teacher_space.Quiz', on_delete=models.CASCADE)  # Adaptez 'quiz_app'
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['quiz', 'student']]  # Un accès unique par user/quiz

class SharedQuizResult(models.Model):
    shared_quiz = models.ForeignKey(SharedQuizAccess, on_delete=models.CASCADE)
    student = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    score = models.IntegerField()
    total_questions = models.IntegerField()
    answers = models.JSONField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.username} - {self.shared_quiz.quiz.titre} - {self.score}/{self.total_questions}"