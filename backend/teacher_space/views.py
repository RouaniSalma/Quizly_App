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




from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Module
from .serializers import ModuleSerializer
import re

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_module(request):
    user = request.user
    if user.role != 'teacher':
        return Response({'error': 'Unauthorized access'}, status=403)

    original_name = request.data.get('name', '').strip()
    if not original_name:
        return Response({'error': 'Subject name is required'}, status=400)

    # Vérification d'unicité
    if Module.objects.filter(name=original_name.lower(), teacher=user).exists():
        return Response({'error': 'This subject already exists'}, status=409)

    try:
        module = Module(
            display_name=original_name,  # Le save() s'occupera de créer le champ name
            teacher=user
        )
        module.save()
        serializer = ModuleSerializer(module)
        return Response(serializer.data, status=201)
    except Exception as e:
        return Response({'error': str(e)}, status=400)


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

################pour verifier l'unicité du module
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_module_unique(request):
    user = request.user
    if user.role != 'teacher':
        return Response({'error': 'Unauthorized access'}, status=status.HTTP_403_FORBIDDEN)

    name = request.query_params.get('name', '').strip().lower()
    name = re.sub(r'\s+', ' ', name)  # Normalisation comme dans la création
    
    if not name:
        return Response(
            {'error': 'Module name is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    exists = Module.objects.filter(name__iexact=name, teacher=user).exists()
    return Response({'is_unique': not exists})
############## Adde for crud modules
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Module
from .serializers import ModuleSerializer

# ... (your existing views)

import logging
logger = logging.getLogger(__name__)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_module(request, module_id):
    logger.info(f"Update request received for module {module_id}")
    logger.info(f"Request data: {request.data}")
    logger.info(f"User: {request.user}")
    
    try:
        module = Module.objects.get(id=module_id, teacher=request.user)
        
        # Prepare data for serializer
        data = {
            'name': request.data.get('name', module.name),
            'display_name': request.data.get('name', module.display_name)
        }
        
        serializer = ModuleSerializer(module, data=data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            logger.info("Module updated successfully")
            return Response(serializer.data)
        else:
            logger.error(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Module.DoesNotExist as e:
        logger.error(f"Module not found: {e}")
        return Response(
            {"error": "Module not found or you don't have permission"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return Response(
            {"error": "An unexpected error occurred"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_module(request, module_id):
    try:
        module = Module.objects.get(id=module_id, teacher=request.user)
    except Module.DoesNotExist:
        return Response(
            {"error": "Module not found or you don't have permission to delete it."},
            status=status.HTTP_404_NOT_FOUND
        )

    module.delete()
    return Response(
        {"message": "Module deleted successfully."},
        status=status.HTTP_204_NO_CONTENT
    )
################################## Ajouté


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
        module = Module.objects.get(id=module_id, teacher=request.user)
    except Module.DoesNotExist:
        return Response({'error': 'Module not found'}, status=404)

    if 'file' not in request.FILES:  # Changé de 'files' à 'file'
        return Response({'error': 'No file provided'}, status=400)

    file = request.FILES['file']
    pdf = PDF.objects.create(
        titre=file.name,
        fichier=file,
        module=module
    )
    return Response(PDFSerializer(pdf).data, status=201)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_quiz(request):
    if request.user.role != 'teacher':
        return Response({'error': 'Unauthorized'}, status=403)

    titre = request.data.get('titre')
    description = request.data.get('description', '')
    module_id = request.data.get('module')

    if not titre or not module_id:
        return Response({'error': 'Title and module are required'}, status=400)

    try:
        module = Module.objects.get(id=module_id, teacher=request.user)
    except Module.DoesNotExist:
        return Response({'error': 'Module not found or not yours'}, status=404)

    quiz = Quiz.objects.create(titre=titre, description=description, module=module)
    return Response(QuizSerializer(quiz).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_module_quizzes(request, module_id):
    try:
        module = Module.objects.get(id=module_id, teacher=request.user)
    except Module.DoesNotExist:
        return Response({'error': 'Module not found'}, status=404)

    quizzes = Quiz.objects.filter(module=module)
    serializer = QuizSerializer(quizzes, many=True)
    return Response(serializer.data)


# Ajoutez ces vues si elles n'existent pas déjà

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def module_detail(request, pk):
    try:
        module = Module.objects.get(id=pk, teacher=request.user)
        serializer = ModuleSerializer(module)
        return Response(serializer.data)
    except Module.DoesNotExist:
        return Response({'error': 'Module not found'}, status=404)

from .serializers import QuizListSerializer
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def module_quizzes(request, module_id):
    try:
        module = Module.objects.get(id=module_id, teacher=request.user)
        quizzes = Quiz.objects.filter(module=module).order_by('-date_creation')
        serializer = QuizListSerializer(quizzes, many=True)
        return Response(serializer.data)
    except Module.DoesNotExist:
        return Response({'error': 'Module not found'}, status=404)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def module_pdfs(request, module_id):
    try:
        module = Module.objects.get(id=module_id, teacher=request.user)
        pdfs = PDF.objects.filter(module=module)
        serializer = PDFSerializer(pdfs, many=True)
        return Response(serializer.data)
    except Module.DoesNotExist:
        return Response({'error': 'Module not found'}, status=404)
    
    ########################## Ajouté
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_pdf(request, module_id, pdf_id):
    try:
        pdf = PDF.objects.get(id=pdf_id, module__id=module_id, module__teacher=request.user)
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
    if request.user.role != 'teacher':
        return Response({'error': 'Unauthorized'}, status=403)

    try:
        module = Module.objects.get(id=module_id, teacher=request.user)
    except Module.DoesNotExist:
        return Response({'error': 'Module not found or not yours'}, status=404)

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

################## Added

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Quiz, Question, Choix
from .serializers import QuizSerializer, QuizDetailSerializer

@api_view(['PUT'])
@permission_classes([IsAuthenticated])

def update_quiz(request, quiz_id):
    try:
        # Accédez aux données avec request.data au lieu de request.POST
        quiz = Quiz.objects.get(id=quiz_id)
        
        # Mettez à jour les champs de base
        quiz.titre = request.data.get('title', quiz.titre)
        quiz.description = request.data.get('description', quiz.description)
        quiz.save()

        # Traitement des questions
        for question_data in request.data.get('questions', []):
            question_id = question_data.get('id')
            if question_id:
                # Mise à jour question existante
                question = Question.objects.get(id=question_id, quiz=quiz)
                question.enonce = question_data.get('text', question.enonce)
                question.save()

                # Mise à jour des choix
                for choice_data in question_data.get('choices', []):
                    choice_id = choice_data.get('id')
                    if choice_id:
                        choix = Choix.objects.get(id=choice_id)
                        choix.texte = choice_data.get('text', '')
                        choix.is_correct = choice_data.get('is_correct', False)
                        choix.save()
                    else:
                        Choix.objects.create(
                            question=question,
                            texte=choice_data.get('text', ''),
                            is_correct=choice_data.get('is_correct', False)
                        )
            else:
                # Création nouvelle question
                new_question = Question.objects.create(
                    quiz=quiz,
                    enonce=question_data.get('text', '')
                )
                for choice_data in question_data.get('choices', []):
                    Choix.objects.create(
                        question=new_question,
                        texte=choice_data.get('text', ''),
                        is_correct=choice_data.get('is_correct', False)
                    )

        return Response(QuizSerializer(quiz).data)
    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_quiz_detail(request, quiz_id):
    try:
        quiz = Quiz.objects.get(id=quiz_id, module__teacher=request.user)
    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found or not yours'}, status=status.HTTP_404_NOT_FOUND)

    serializer = QuizDetailSerializer(quiz)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_quiz(request, quiz_id):
    try:
        quiz = Quiz.objects.get(id=quiz_id, module__teacher=request.user)
    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found or not yours'}, status=status.HTTP_404_NOT_FOUND)

    quiz.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# Dans views.py

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_pdf_uploaded(request, module_id):
    try:
        module = Module.objects.get(id=module_id, teacher=request.user)
        has_pdf = PDF.objects.filter(module=module).exists()
        return Response({'has_pdf': has_pdf})
    except Module.DoesNotExist:
        return Response({'error': 'Module not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_latest_pdf(request, module_id):
    try:
        module = Module.objects.get(id=module_id, teacher=request.user)
        pdf = PDF.objects.filter(module=module).order_by('-date_upload').first()
        if pdf:
            return Response({
                'id': pdf.id,
                'name': pdf.titre,
                'url': request.build_absolute_uri(pdf.fichier.url)
            })
        return Response({'error': 'No PDF found'}, status=404)
    except Module.DoesNotExist:
        return Response({'error': 'Module not found'}, status=404)
    
from .serializers import GeneratedQuizSerializer
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_generated_quiz(request, module_id):
    """Récupère le dernier quiz généré pour un module"""
    try:
        module = Module.objects.get(id=module_id, teacher=request.user)
        quiz = Quiz.objects.filter(module=module, is_generated=True).order_by('-date_creation').first()
        
        if not quiz:
            return Response({'error': 'No generated quiz found'}, status=404)
            
        serializer = GeneratedQuizSerializer(quiz)
        return Response(serializer.data)
        
    except Module.DoesNotExist:
        return Response({'error': 'Module not found'}, status=404)
###### pour la suppression de la question aussi cote backend 
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_question(request, question_id):
    try:
        question = Question.objects.get(id=question_id, quiz__module__teacher=request.user)
        question.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Question.DoesNotExist:
        return Response({'error': 'Question not found or not yours'}, status=status.HTTP_404_NOT_FOUND)
    
################## View pour gerer le partage du quiz

    

# Dans views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny  # Nouvel import
import uuid
@api_view(['GET'])
@permission_classes([AllowAny])  # Autorise l'accès sans token
def quiz_access_view(request, quiz_id, token):
    try:
        quiz = Quiz.objects.get(id=quiz_id, share_token=token)
        if not quiz.is_accessible():
            return Response({'error': 'Quiz no longer available'}, status=403)
        return Response(QuizSerializer(quiz).data)
    except Quiz.DoesNotExist:
        return Response({'error': 'Invalid quiz link'}, status=404)

"""student passes the quiz teacher"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils.dateparse import parse_datetime
from django.utils import timezone as dj_timezone
from datetime import timezone as py_timezone
import uuid

from .models import Quiz
from .serializers import QuizSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def share_quiz(request, quiz_id):
    try:
        quiz = Quiz.objects.get(id=quiz_id, module__teacher=request.user)
    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found or not yours'}, status=404)
    
    # Générer un nouveau token si nécessaire
    if not quiz.share_token:
        quiz.share_token = uuid.uuid4()
    
    restrictions = request.data.get('restrictions', {})
    expiry_date = restrictions.get('expiry_date')
    max_participants = restrictions.get('max_participants')

    # ===> DEBUG PRINTS
    print("DEBUG restrictions:", restrictions)
    print("DEBUG expiry_date reçu:", expiry_date, type(expiry_date))
    print("DEBUG max_participants reçu:", max_participants, type(max_participants))

    # Conversion UTC sécurisée
    if expiry_date:
        dt = parse_datetime(expiry_date)
        if dt is not None:
            # Si la date est naive, on la rend aware en UTC
            if dj_timezone.is_naive(dt):
                dt = dt.replace(tzinfo=py_timezone.utc)
            else:
                dt = dt.astimezone(py_timezone.utc)
            quiz.expiry_date = dt
        else:
            quiz.expiry_date = None
    else:
        quiz.expiry_date = None

    old_max_participants = quiz.max_participants
    if max_participants in [None, '', 'null']:
        quiz.max_participants = None
    else:
        try:
            value = int(max_participants)
            quiz.max_participants = value if value > 0 else None
            if old_max_participants != quiz.max_participants:
                quiz.current_participants = 0
        except (ValueError, TypeError):
            quiz.max_participants = None

    # ===> DEBUG PRINTS
    print("DEBUG quiz.expiry_date enregistré:", quiz.expiry_date, type(quiz.expiry_date))
    print("DEBUG quiz.max_participants enregistré:", quiz.max_participants, type(quiz.max_participants))

    quiz.access_restricted = bool(quiz.expiry_date or quiz.max_participants)
    quiz.last_shared = dj_timezone.now()
    quiz.save()
    
    share_url = request._request.build_absolute_uri(
        f'/api/teacher/quizzes/{quiz.id}/access/{quiz.share_token}/'
    )
    
    return Response({
        'share_url': share_url,
        **QuizSerializer(quiz).data
    })
from rest_framework.permissions import AllowAny
from .shared_serializers import SharedQuizDetailSerializer
from django.utils import timezone
@api_view(['GET'])
@permission_classes([AllowAny])
def quiz_access_view(request, quiz_id, token):
    try:
        quiz = Quiz.objects.get(id=quiz_id, share_token=token)
    except Quiz.DoesNotExist:
        return Response({'error': 'Invalid quiz link'}, status=404)

    from django.utils import timezone
    print("DEBUG: expiry_date =", quiz.expiry_date)
    print("DEBUG: now =", timezone.now())
    
    accessible, message = quiz.is_accessible()
    if not accessible:
      return Response({'error': message}, status=403)
    
    serializer = SharedQuizDetailSerializer(quiz)
    return Response(serializer.data)
from student_space.models import SharedQuizResult
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def quiz_results(request, quiz_id):
    try:
        quiz = Quiz.objects.get(id=quiz_id, module__teacher=request.user)
    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found or not yours'}, status=404)
    
    # Récupérer tous les résultats pour ce quiz
    results = SharedQuizResult.objects.filter(shared_quiz__quiz=quiz).select_related('student')
    
    results_data = []
    for result in results:
        results_data.append({
            'student_id': result.student.id,
            'student_name': result.student.username,
            'score': result.score,
            'total_questions': result.total_questions,
            'percentage': int((result.score / result.total_questions) * 100),
            'submitted_at': result.submitted_at
        })
    
    return Response({
        'quiz_id': quiz.id,
        'quiz_title': quiz.titre,
        'total_participants': quiz.current_participants,
        'results': results_data
    })
"""Tabaleaux de board"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Quiz
from student_space.models import SharedQuizResult

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shared_quiz_results_by_student(request, quiz_id):
    # Vérifier que le prof est bien le propriétaire du quiz
    quiz = Quiz.objects.get(id=quiz_id, module__teacher=request.user)
    results = SharedQuizResult.objects.filter(shared_quiz__quiz=quiz).select_related('student')
    data = []
    for result in results:
        data.append({
    'student_id': result.student.id,
    'student_email': result.student.email,
    'student_first_name': result.student.first_name,
    'student_last_name': result.student.last_name,
    'score': result.score,
    'total_questions': result.total_questions,
    'percentage': int((result.score / result.total_questions) * 100) if result.total_questions else 0,
    'date': result.submitted_at,
    'answers': result.answers,
})
    return Response(data)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shared_quiz_results_by_module(request, module_id):
    # Vérifier que le prof est bien le propriétaire du module
    module = Module.objects.get(id=module_id, teacher=request.user)
    quizzes = Quiz.objects.filter(module=module)
    data = []
    for quiz in quizzes:
        results = SharedQuizResult.objects.filter(shared_quiz__quiz=quiz)
        for result in results:
            data.append({
                'quiz_id': quiz.id,
                'quiz_title': quiz.titre,
                'student_id': result.student.id,
                'student_username': result.student.username,
                'score': result.score,
                'total_questions': result.total_questions,
                'percentage': int((result.score / result.total_questions) * 100) if result.total_questions else 0,
                'date': result.submitted_at,
            })
    return Response(data)
import csv
from django.http import HttpResponse

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_shared_quiz_results_csv(request, quiz_id):
    try:
        quiz = Quiz.objects.get(id=quiz_id, module__teacher=request.user)
        results = SharedQuizResult.objects.filter(shared_quiz__quiz=quiz).select_related('student')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="quiz_{quiz_id}_results.csv"'

        writer = csv.writer(response)
        writer.writerow(['First Name', 'Last Name', 'Email', 'Score', 'Total Questions', 'Percentage', 'Date'])

        print("DEBUG nb résultats:", results.count())
        for result in results:
            print("DEBUG student:", result.student.email, result.student.first_name, result.student.last_name)
            writer.writerow([
                result.student.first_name,
                result.student.last_name,
                result.student.email,
                result.score,
                result.total_questions,
                int((result.score / result.total_questions) * 100) if result.total_questions else 0,
                result.submitted_at.strftime('%Y-%m-%d %H:%M')
            ])
        return response
    except Exception as e:
        print("EXPORT CSV ERROR:", e)
        return HttpResponse(f"Erreur lors de l'export CSV: {e}", content_type="text/plain", status=500)
from reportlab.pdfgen import canvas
from django.http import HttpResponse

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_shared_quiz_results_pdf(request, quiz_id):
    quiz = Quiz.objects.get(id=quiz_id, module__teacher=request.user)
    results = SharedQuizResult.objects.filter(shared_quiz__quiz=quiz).select_related('student')

    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="quiz_{quiz_id}_results.pdf"'

    p = canvas.Canvas(response)
    p.drawString(100, 800, f"Résultats du quiz : {quiz.titre}")

    y = 780
    for result in results:
     line = (
        f"{result.student.first_name} {result.student.last_name} ({result.student.email}) - "
        f"Score: {result.score}/{result.total_questions} "
        f"({int((result.score / result.total_questions) * 100) if result.total_questions else 0}%) - "
        f"{result.submitted_at.strftime('%Y-%m-%d %H:%M')}"
    )
    p.drawString(100, y, line)
    y -= 20
    if y < 50:
        p.showPage()
        y = 800

    p.save()
    return response