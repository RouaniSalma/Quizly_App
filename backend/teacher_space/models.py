from django.db import models
from auth_app.models import CustomUser


# Create your models here.
class Module(models.Model):
    name = models.CharField(max_length=100)
    teacher = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


"""
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


class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    enonce = models.TextField()
    bonnes_reponses = models.ManyToManyField("Choix", related_name="questions_ou_je_suis_bonne_reponse")


# Choix de la reponse
class Choix(models.Model):
    question = models.ForeignKey("Question", on_delete=models.CASCADE, related_name="choix")
    texte = models.CharField(max_length=200)
"""