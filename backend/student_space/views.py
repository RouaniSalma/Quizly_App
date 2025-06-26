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
        return Response({'error': 'Unauthorized access'}, status=status.HTTP_403_FORBIDDEN)

    name = request.data.get('name')
    if not name:
        return Response({'error': 'Category name is required'}, status=status.HTTP_400_BAD_REQUEST)

    normalized_name = name.lower().strip().replace(' ', '')
    
    if Module.objects.filter(normalized_name=normalized_name, student=user).exists():
        return Response(
            {'error': 'You already have a category with this name'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        module = Module.objects.create(name=name, student=user)
        serializer = ModuleSerializer(module)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

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
from .models import Module, PDF, Quiz, Question, Choix, QuizResult
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



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_quiz(request, quiz_id):
    try:
        quiz = Quiz.objects.get(id=quiz_id)
        answers = request.data.get('answers', [])
        score = 0
        answers_data = []

        for answer in answers:
            question = quiz.questions.get(id=answer['question_id'])
            selected_choice_index = answer['selected_choice_index']
            is_correct = False
            
            if selected_choice_index is not None:
                correct_choice = question.choix.filter(is_correct=True).first()
                if correct_choice and selected_choice_index == list(question.choix.all()).index(correct_choice):
                    score += 1
                    is_correct = True
            
            answers_data.append({
                'question_id': question.id,
                'selected_choice_index': selected_choice_index,
                'is_correct': is_correct
            })

        # Créez le résultat avec les réponses
        result = QuizResult.objects.create(
            quiz=quiz,
            student=request.user,
            score=score,
            total_questions=quiz.questions.count(),
            answers=answers_data  # Stockez les réponses ici
        )

        return Response({
            'score': score,
            'total_questions': quiz.questions.count(),
            'percentage': int((score / quiz.questions.count()) * 100) if quiz.questions.count() > 0 else 0,
            'result_id': result.id
        }, status=200)

    except Exception as e:
        return Response({'error': str(e)}, status=400)

################pour verifier l'unicité du module
from rest_framework import status
import re


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_category_unique(request):
    user = request.user
    if user.role != 'student':
        return Response({'error': 'Unauthorized access'}, status=status.HTTP_403_FORBIDDEN)

    name = request.query_params.get('name', '').strip()
    if not name:
        return Response(
            {'error': 'Module name is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    normalized_name = name.lower().strip().replace(' ', '')
    exists = Module.objects.filter(normalized_name=normalized_name, student=user).exists()
    return Response({'is_unique': not exists})

########### CRUD Categories
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
def update_category(request, category_id):
    logger.info(f"Update request received for module {category_id}")
    logger.info(f"Request data: {request.data}")
    logger.info(f"User: {request.user}")
    
    try:
        module = Module.objects.get(id=category_id, student=request.user)
        
        # Prepare data for serializer
        data = {
            'name': request.data.get('name', module.name),
            'normalized_name': request.data.get('name', module.normalized_name)
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
def delete_category(request, category_id):
    try:
        module = Module.objects.get(id=category_id, student=request.user)
    except Module.DoesNotExist:
        return Response(
            {"error": "Category not found or you don't have permission to delete it."},
            status=status.HTTP_404_NOT_FOUND
        )

    module.delete()
    return Response(
        {"message": "Category deleted successfully."},
        status=status.HTTP_204_NO_CONTENT)

########## quiz history
# Ajoutez ces vues à votre fichier views.py existant
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Module, Quiz, QuizResult  # Ajoute ces imports



from .models import Module, Quiz, QuizResult, SharedQuizResult

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_module_quizzes(request, module_id):
    if request.user.role != 'student':
        return Response({'error': 'Unauthorized'}, status=403)
    
    try:
        module = Module.objects.get(id=module_id, student=request.user)
        quizzes = Quiz.objects.filter(module=module).select_related('module')
        
        quiz_data = []
        # Quizzes classiques
        for quiz in quizzes:
            latest_result = QuizResult.objects.filter(
                quiz=quiz, 
                student=request.user
            ).order_by('-date_taken').first()
            quiz_info = {
                'id': quiz.id,
                'titre': quiz.titre,
                'description': quiz.description,
                'date_creation': quiz.date_creation,
                'questions_count': quiz.questions.count(),
                'is_generated': quiz.is_generated,
                'last_attempt': {
                    'score': latest_result.score if latest_result else None,
                    'total_questions': latest_result.total_questions if latest_result else None,
                    'percentage': int((latest_result.score / latest_result.total_questions) * 100) if latest_result else None,
                    'date_completion': latest_result.date_taken if latest_result else None,
                    'attempts_count': QuizResult.objects.filter(quiz=quiz, student=request.user).count()
                },
                'type': 'classic'
            }
            quiz_data.append(quiz_info)
        
        # Quizzes partagés (shared)
        shared_results = SharedQuizResult.objects.filter(student=request.user)
        for shared_result in shared_results:
            quiz = shared_result.shared_quiz.quiz
            quiz_info = {
                'id': f"shared-{quiz.id}",
                'titre': quiz.titre,
                'description': quiz.description,
                'date_creation': quiz.date_creation,
                'questions_count': quiz.questions.count(),
                'is_generated': getattr(quiz, 'is_generated', False),
                'last_attempt': {
                    'score': shared_result.score,
                    'total_questions': shared_result.total_questions,
                    'percentage': int((shared_result.score / shared_result.total_questions) * 100) if shared_result.total_questions else None,
                    'date_completion': shared_result.submitted_at,
                    'attempts_count': 1
                },
                'type': 'shared'
            }
            quiz_data.append(quiz_info)
        
        # Trie par date de création ou de passage
        quiz_data.sort(key=lambda x: x['date_creation'], reverse=True)
        return Response(quiz_data)
        
    except Module.DoesNotExist:
        return Response({'error': 'Module not found or not yours'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_quiz_detail(request, module_id, quiz_id):
    """Récupère un quiz spécifique avec ses questions"""
    if request.user.role != 'student':
        return Response({'error': 'Unauthorized'}, status=403)
    
    try:
        module = Module.objects.get(id=module_id, student=request.user)
        quiz = Quiz.objects.get(id=quiz_id, module=module)
        
        questions = []
        for question in quiz.questions.all():
            choices = []
            for choice in question.choix.all():
                choices.append({
                    'id': choice.id,
                    'texte': choice.texte,
                    'is_correct': choice.is_correct
                })
            
            questions.append({
                'id': question.id,
                'enonce': question.enonce,
                'choix': choices
            })
        
        return Response({
            'id': quiz.id,
            'titre': quiz.titre,
            'description': quiz.description,
            'questions': questions
        })
        
    except (Module.DoesNotExist, Quiz.DoesNotExist):
        return Response({'error': 'Quiz not found or not accessible'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_latest_quiz_result(request, quiz_id):
    try:
        latest_result = QuizResult.objects.filter(
            quiz__id=quiz_id,
            student=request.user
        ).order_by('-date_taken').first()
        
        if not latest_result:
            return Response({'error': 'No results found'}, status=404)
            
        return Response({
            'score': latest_result.score,
            'total_questions': latest_result.total_questions,
            'percentage': int((latest_result.score / latest_result.total_questions) * 100),
            'date_taken': latest_result.date_taken
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_answers(request, quiz_id):
    try:
        latest_result = QuizResult.objects.filter(
            quiz__id=quiz_id,
            student=request.user
        ).order_by('-date_taken').first()
        
        if not latest_result:
            return Response({'error': 'No quiz results found'}, status=404)
        
        # Retournez les réponses stockées
        return Response(latest_result.answers)
        
    except Exception as e:
        logger.error(f"Error in get_user_answers: {str(e)}")
        return Response({'error': 'Internal server error'}, status=500)
    
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_quiz(request, module_id, quiz_id):
    try:
        quiz = Quiz.objects.get(id=quiz_id, module__id=module_id, module__student=request.user)
        quiz.delete()
        return Response(
            {"message": "Quiz deleted successfully."},
            status=status.HTTP_204_NO_CONTENT
        )
    except Quiz.DoesNotExist:
        return Response(
            {"error": "Quiz not found or you don't have permission to delete it."},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    ############student passe quiz teacher
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

import uuid
from .models import SharedQuizAccess, SharedQuizResult

from django.shortcuts import get_object_or_404
import uuid
from django.utils import timezone
from .models import SharedQuizAccess, SharedQuizResult

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def access_shared_quiz(request):
    # L'étudiant fournit le lien complet du quiz partagé
    quiz_link = request.data.get('quiz_link', '').strip()
    
    # Extraire l'ID du quiz et le token d'accès depuis l'URL
    try:
        parts = quiz_link.split('/')
        quiz_id = int(parts[-3])
        access_token = uuid.UUID(parts[-2])
    except (IndexError, ValueError):
        return Response({'error': 'Invalid quiz link format'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Récupérer le quiz
    try:
        quiz = Quiz.objects.get(id=quiz_id)
    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Créer ou récupérer un accès pour cet étudiant
    access, created = SharedQuizAccess.objects.get_or_create(
        quiz=quiz,
        student=request.user,
        defaults={'access_token': access_token}
    )
    
    print("DEBUG: shared_quiz_detail appelée, expiry_date =", quiz.expiry_date, "now =", timezone.now())
    # === AJOUTE LES RESTRICTIONS ICI ===
    from django.utils import timezone

    if hasattr(quiz, 'expiry_date') and quiz.expiry_date and timezone.now() > quiz.expiry_date:
        return Response({'error': 'This quiz has expired'}, status=status.HTTP_403_FORBIDDEN)

    if hasattr(quiz, 'max_participants') and quiz.max_participants and getattr(quiz, 'current_participants', 0) >= quiz.max_participants:
        return Response({'error': 'Maximum number of participants reached'}, status=status.HTTP_403_FORBIDDEN)

    from .models import SharedQuizResult
    if SharedQuizResult.objects.filter(shared_quiz=access, student=request.user).exists():
        return Response({'error': 'You have already submitted this quiz'}, status=status.HTTP_403_FORBIDDEN)
    # === FIN DES RESTRICTIONS ===

    # Sérialiser les données du quiz pour la réponse
    quiz_data = {
        'id': quiz.id,
        'title': quiz.titre,
        'description': quiz.description,
        'questions': []
    }
    for question in quiz.questions.all():
        question_data = {
            'id': question.id,
            'text': question.enonce,
            'choices': [
                {'id': choice.id, 'text': choice.texte}
                for choice in question.choix.all()
            ]
        }
        quiz_data['questions'].append(question_data)
    
    return Response(quiz_data)




from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import SharedQuizAccess, SharedQuizResult

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_shared_quiz(request, quiz_id):
    """
    Submit answers for a shared quiz and calculate results.
    """
    try:
        access, created = SharedQuizAccess.objects.get_or_create(
            quiz_id=quiz_id,
            student=request.user,
            defaults={'is_used': False}
        )
        
        if access.is_used:
            return Response(
                {'error': 'You have already submitted this quiz'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        answers = request.data.get('answers', [])
        if not answers:
            return Response(
                {'error': 'No answers provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        score = 0
        detailed_answers = []

        for answer in answers:
            question = get_object_or_404(access.quiz.questions, id=answer['question_id'])
            try:
                selected_choice = question.choix.all()[answer['selected_choice_index']]
            except IndexError:
                return Response(
                    {'error': f'Invalid choice index for question {answer["question_id"]}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            is_correct = selected_choice.is_correct
            if is_correct:
                score += 1
            
            detailed_answers.append({
                'question_id': question.id,
                'selected_choice_index': answer['selected_choice_index'],
                'is_correct': is_correct,
                'explanation': getattr(question, 'explanation', '')
            })
        
        result = SharedQuizResult.objects.create(
            shared_quiz=access,
            student=request.user,
            score=score,
            total_questions=len(answers),
            answers=detailed_answers
        )
        
        access.is_used = True
        access.save()
        
        quiz = access.quiz
        quiz.current_participants += 1
        quiz.save()
        
        return Response({
            'score': score,
            'total_questions': len(answers),
            'percentage': int((score / len(answers)) * 100),
            'result_id': result.id,
            'message': 'Quiz submitted successfully'
        })

    except Exception as e:
        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
from rest_framework.response import Response
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shared_quiz_detail(request, quiz_id):
    """
    Permet à l'étudiant de consulter les détails d'un quiz partagé déjà passé,
    même si les restrictions sont atteintes.
    """
    try:
        access = SharedQuizAccess.objects.get(quiz_id=quiz_id, student=request.user)
        quiz = access.quiz

        # Vérifie si l'étudiant a déjà un résultat pour ce quiz partagé
        result = SharedQuizResult.objects.filter(shared_quiz=access, student=request.user).order_by('-submitted_at').first()
        if not result:
            # Si pas de résultat, appliquer les restrictions (empêcher la consultation)
            if hasattr(quiz, 'expiry_date') and quiz.expiry_date and timezone.now() > quiz.expiry_date:
                return Response({'error': 'This quiz has expired'}, status=status.HTTP_403_FORBIDDEN)
            if hasattr(quiz, 'max_participants') and quiz.max_participants and getattr(quiz, 'current_participants', 0) >= quiz.max_participants:
                return Response({'error': 'Maximum number of participants reached'}, status=status.HTTP_403_FORBIDDEN)
        # Si l'étudiant a déjà un résultat, il peut consulter même si restrictions atteintes

        questions = []
        for question in quiz.questions.all():
            choices = []
            for choice in question.choix.all():
                choices.append({
                    'id': choice.id,
                    'texte': choice.texte,
                    'is_correct': choice.is_correct
                })
            questions.append({
                'id': question.id,
                'enonce': question.enonce,
                'choix': choices
            })
        return Response({
            'id': quiz.id,
            'titre': quiz.titre,
            'description': quiz.description,
            'questions': questions,
            'last_result': {
                'score': result.score if result else None,
                'total_questions': result.total_questions if result else None,
                'percentage': int((result.score / result.total_questions) * 100) if result and result.total_questions else None,
                'date_completion': result.submitted_at if result else None,
                'answers': result.answers if result else []
            }
        })
    except SharedQuizAccess.DoesNotExist:
        return Response({'error': 'Quiz not found or not accessible'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_shared_quiz_result(request, quiz_id):
    """
    Permet à l'étudiant de supprimer son résultat pour un quiz partagé.
    """
    try:
        access = SharedQuizAccess.objects.get(quiz_id=quiz_id, student=request.user)
        result = SharedQuizResult.objects.filter(shared_quiz=access, student=request.user).first()
        if result:
            result.delete()
            # Optionnel : supprimer l'accès aussi si tu veux tout nettoyer
            access.delete()
            return Response({"message": "Shared quiz result deleted successfully."}, status=204)
        else:
            return Response({"error": "No shared quiz result found."}, status=404)
    except SharedQuizAccess.DoesNotExist:
        return Response({"error": "No shared quiz access found."}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)