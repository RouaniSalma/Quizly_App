# core/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission

class User(AbstractUser):
    is_student = models.BooleanField(default=False)
    is_teacher = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    # Si tu as des champs personnalisés, ajoute-les ici
    groups = models.ManyToManyField(Group, related_name='core_user_groups')
    user_permissions = models.ManyToManyField(Permission, related_name='core_user_permissions')


class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    niveau = models.CharField(max_length=20)  # Ex: "Licence 1", "Master 2"

class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    specialite = models.CharField(max_length=100)

class Admin(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    departement = models.CharField(max_length=100)