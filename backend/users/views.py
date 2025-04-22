from rest_framework import generics
from .models import User
from .serializers import UserSerializer
from django.http import HttpResponse

from django.shortcuts import render

def home_view(request):
    return render(request, 'home.html')

def home_view(request):
    return HttpResponse("Bienvenue sur mon site Django !")

class UserCreateAPIView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = []  # Permet l'inscription sans auth