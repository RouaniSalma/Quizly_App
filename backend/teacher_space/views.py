from django.shortcuts import render

# Create your views here.
from django.shortcuts import redirect
from teacher_space.models import Module

def after_login_redirect(request):
    if request.user.is_authenticated:
        if request.user.role == 'teacher':
            modules = Module.objects.filter(teacher=request.user)
            if modules.exists():
                return redirect('/teacher/modules')  # url vers la liste des modules
            else:
                return redirect('/teacher-create-module')  # url vers la création de module
        elif request.user.role == 'student':
            return redirect('student_dashboard')  # par exemple
        elif request.user.role == 'admin':
            return redirect('admin_dashboard')  # par exemple
    else:
        return redirect('login')  # sécurité : utilisateur non connecté

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Module

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_teacher_modules(request):
    user = request.user
    if user.role != 'teacher':
        return Response({'error': 'Unauthorized access'}, status=403)
    
    # Vérifie si ce teacher a des modules
    has_modules = Module.objects.filter(teacher=user).exists()
    
    return Response({'has_modules': has_modules})

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Module
from .serializers import ModuleSerializer




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_module(request):
    user = request.user
    if user.role != 'teacher':
        return Response({'error': 'Unauthorized access'}, status=403)

    name = request.data.get('name')
    if not name:
        return Response({'error': 'Module name is required'}, status=400)

    module = Module.objects.create(name=name, teacher=user)
    serializer = ModuleSerializer(module)
    return Response(serializer.data)  # ➔ renvoyer tout le module !


# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Module
from .serializers import ModuleSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_modules(request):
    if request.user.role != 'teacher':
        return Response({'error': 'Unauthorized'}, status=403)
    
    modules = Module.objects.filter(teacher=request.user)
    serializer = ModuleSerializer(modules, many=True)
    return Response(serializer.data)  # Renvoyer directement les données sérialisées
