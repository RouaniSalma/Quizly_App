# serializers.py
from rest_framework import serializers
from .models import Module

class ModuleSerializer(serializers.ModelSerializer):
    teacher = serializers.StringRelatedField()  # Affiche le nom d'utilisateur
    class Meta:
        model = Module
        fields = ['id', 'name', 'teacher', 'created_at']
