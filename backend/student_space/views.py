from django.shortcuts import render
from django.shortcuts import redirect
from student_space.models import Module
# Create your views here.
# Vue de redirection après login
def after_login_redirect(request):
    if request.user.is_authenticated:
        if request.user.role == 'student':
            modules = Module.objects.filter(student=request.user)
            if modules.exists():
                return redirect('/student/categories')  # url vers la liste des modules
            else:
                return redirect('/student-create-category')  # url vers la création de module
        elif request.user.role == 'student':
            return redirect('student_dashboard')  # par exemple
        elif request.user.role == 'admin':
            return redirect('admin_dashboard')  # par exemple
    else:
        return redirect('login')
# Vues pour les modules
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Module

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_student_categories(request):
    user = request.user
    if user.role != 'student':
        return Response({'error': 'Unauthorized access'}, status=403)
    
    # Vérifie si ce student a des modules
    has_modules = Module.objects.filter(student=user).exists()
    
    return Response({'has_modules': has_modules})

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Module
from .serializers import ModuleSerializer




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_category(request):
    user = request.user
    if user.role != 'student':
        return Response({'error': 'Unauthorized access'}, status=403)

    name = request.data.get('name')
    if not name:
        return Response({'error': 'Category name is required'}, status=400)

    module = Module.objects.create(name=name, student=user)
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
def student_categories(request):
    if request.user.role != 'student':
        return Response({'error': 'Unauthorized'}, status=403)
    
    modules = Module.objects.filter(student=request.user)
    serializer = ModuleSerializer(modules, many=True)
    return Response(serializer.data)  # Renvoyer directement les données sérialisées

######################## Part of drag and drop and generate quiz
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def category_detail(request, pk):
    try:
        module = Module.objects.get(id=pk, student=request.user)
        serializer = ModuleSerializer(module)
        return Response(serializer.data)
    except Module.DoesNotExist:
        return Response({'error': 'Category not found'}, status=404)
from .models import PDF, Quiz, Question, Choix
from .serializers import PDFSerializer, QuizSerializer, QuestionSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import JSONParser
from rest_framework.response import Response

from rest_framework.parsers import MultiPartParser, FormParser

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_pdfs(request, module_id):
    try:
        module = Module.objects.get(id=module_id, student=request.user)
    except Module.DoesNotExist:
        return Response({'error': 'Category not found'}, status=404)

    if 'file' not in request.FILES:  # Changé de 'files' à 'file'
        return Response({'error': 'No file provided'}, status=400)

    file = request.FILES['file']
    pdf = PDF.objects.create(
        titre=file.name,
        fichier=file,
        module=module
    )
    return Response(PDFSerializer(pdf).data, status=201)

##################
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def module_pdfs(request, module_id):
    try:
        module = Module.objects.get(id=module_id, student=request.user)
        pdfs = PDF.objects.filter(module=module)
        serializer = PDFSerializer(pdfs, many=True)
        return Response(serializer.data)
    except Module.DoesNotExist:
        return Response({'error': 'Category not found'}, status=404)
    
    ########################## Ajouté
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_pdf(request, module_id, pdf_id):
    try:
        pdf = PDF.objects.get(id=pdf_id, module__id=module_id, module__student=request.user)
        pdf.fichier.delete()  # Supprime le fichier physique
        pdf.delete()         # Supprime l'entrée en base
        return Response(status=204)
    except PDF.DoesNotExist:
        return Response({'error': 'PDF not found'}, status=404)

#################### LLM

# Assurez-vous que ces imports sont tout en haut de votre fichier views.py
from PyPDF2 import PdfReader
from .serializers import (
    PDFSerializer, 
    QuizSerializer, 
   
)
from .services.gemini_service import GeminiService
import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Module, PDF, Quiz, Question, Choix
from .serializers import QuizSerializer



from rest_framework.response import Response
from PyPDF2 import PdfReader  # Assure-toi que cette importation est présente
from .models import Module, PDF, Quiz, Question, Choix
from .serializers import QuizSerializer
from .services import gemini_service  # Remplace par le bon chemin si nécessaire


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_quiz(request, module_id):
    if request.user.role != 'student':
        return Response({'error': 'Unauthorized'}, status=403)

    try:
        module = Module.objects.get(id=module_id, student=request.user)
    except Module.DoesNotExist:
        return Response({'error': 'Category not found or not yours'}, status=404)

    # Vérifie qu'un PDF est uploadé
    if not PDF.objects.filter(module=module).exists():
        return Response({'error': 'No PDF uploaded for this module'}, status=400)

    # Récupère le texte du dernier PDF uploadé
    latest_pdf = PDF.objects.filter(module=module).order_by('-date_upload').first()
    full_text = ""
    
    try:
        reader = PdfReader(latest_pdf.fichier)
        for page in reader.pages:
            full_text += page.extract_text() + "\n"
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return Response({'error': 'Could not extract text from PDF'}, status=400)

    # Génère le quiz avec votre service Gemini
    gemini = GeminiService()
    quiz_data = gemini.generate_quiz_from_text(full_text)
    
    if not quiz_data or 'questions' not in quiz_data:
        return Response({'error': 'Failed to generate quiz from text'}, status=500)

    # Crée le quiz dans la base de données
    try:
        quiz = Quiz.objects.create(
            module=module,
            titre=quiz_data.get('title', f'Quiz pour {module.name}')[:100],
            description=quiz_data.get('description', '')[:500],
            is_generated=True
        )

        questions = []
        for q in quiz_data['questions']:
            question = Question.objects.create(
                quiz=quiz,
                enonce=q['question'][:500]
            )
            
            choices = []
            for i, option in enumerate(q['options'][:4]):  # Limite à 4 options
                is_correct = (i == q['correct_answer'])
                choice = Choix.objects.create(
                    question=question,
                    texte=option[:200],
                    is_correct=is_correct
                )
                choices.append({
                    'id': choice.id,
                    'text': choice.texte,
                    'is_correct': choice.is_correct
                })
            
            questions.append({
                'id': question.id,
                'text': question.enonce,
                'choices': choices,
                'correct_answer': q['correct_answer']
            })

        return Response({
            'id': quiz.id,
            'title': quiz.titre,
            'description': quiz.description,
            'is_generated': True,
            'questions': questions
        }, status=201)

    except Exception as e:
        print(f"Error saving quiz: {e}")
        return Response({'error': str(e)}, status=500)
