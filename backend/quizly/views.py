from django.shortcuts import render

# Create your views here.

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import AdminUser, AdminLog
from .serializers import AdminUserSerializer, AdminLogSerializer
from django.utils import timezone
from auth_app.models import CustomUser
from student_space.models import Quiz, QuizResult

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'admin' and request.user.is_active

@api_view(['POST'])
def admin_login(request):
    print("Tentative de connexion admin...")
    print("Données reçues:", request.data)
    
    email = request.data.get('email')
    password = request.data.get('password')
    print(f"Email reçu: {email}")

    if not email or not password:
        print("Email ou mot de passe manquant")
        return Response(
            {'error': 'Email et mot de passe requis'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        print("Recherche de l'utilisateur...")
        user = CustomUser.objects.get(email=email)
        print(f"Utilisateur trouvé: {user.email}, rôle: {user.role}")
        
        if not user.check_password(password):
            print("Mot de passe incorrect")
            return Response(
                {'error': 'Email ou mot de passe incorrect'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.is_active:
            print("Compte désactivé")
            return Response(
                {'error': 'Compte désactivé'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            print("Recherche des droits admin...")
            admin_user = AdminUser.objects.get(user=user)
            print(f"Admin trouvé: {admin_user}, super_admin: {admin_user.is_super_admin}")
            
            admin_user.last_login = timezone.now()
            admin_user.save()

            # Créer le log de connexion
            AdminLog.objects.create(
                admin=admin_user,
                action='LOGIN',
                ip_address=request.META.get('REMOTE_ADDR')
            )

            refresh = RefreshToken.for_user(user)
            print("Token généré avec succès")
            
            response_data = {
                'error': False,
                'message': 'Login successful',
                'data': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'role': user.role,
                        'is_active': user.is_active,
                        'email_verified': user.email_verified
                    }
                }
            }
            print("Réponse finale:", response_data)
            return Response(response_data)
            
        except AdminUser.DoesNotExist:
            print("L'utilisateur n'a pas les droits admin")
            return Response(
                {'error': 'Accès non autorisé. Vous n\'avez pas les droits d\'administrateur.'},
                status=status.HTTP_403_FORBIDDEN
            )
    except CustomUser.DoesNotExist:
        print("Utilisateur non trouvé")
        return Response(
            {'error': 'Email ou mot de passe incorrect'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        print("Erreur inattendue:", str(e))
        return Response(
            {'error': 'Une erreur est survenue lors de la connexion'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_dashboard(request):
    print("=== admin_dashboard called ===")
    try:
        stats = {
            'teachers': CustomUser.objects.filter(role='teacher').count(),
            'students': CustomUser.objects.filter(role='student').count(),
            'quizzes': Quiz.objects.count(),
            'users': CustomUser.objects.count(),
            'total_teachers': CustomUser.objects.filter(role='teacher').count(),
            'total_students': CustomUser.objects.filter(role='student').count(),
            'total_quizzes': Quiz.objects.count(),
            'total_users': CustomUser.objects.count(),
        }
        return Response(stats)
    except Exception as e:
        print(f"Error in admin_dashboard: {str(e)}")
        return Response(
            {'error': 'An error occurred while loading dashboard data'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_logs(request):
    try:
        logs = AdminLog.objects.all().order_by('-created_at')
        serializer = AdminLogSerializer(logs, many=True)
        return Response(serializer.data)
    except Exception as e:
        print(f"Error in admin_logs: {str(e)}")
        return Response(
            {'error': 'An error occurred while loading admin logs'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_users(request):
    try:
        users = CustomUser.objects.all()
        user_data = [{
            'id': user.id,
            'username': user.email,
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active,
            'date_joined': user.date_joined
        } for user in users]
        return Response(user_data)
    except Exception as e:
        print(f"Error in admin_users: {str(e)}")
        return Response(
            {'error': 'An error occurred while loading users'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_user_detail(request, user_id):
    try:
        print(f"\n=== Mise à jour utilisateur {user_id} ===")
        print("Méthode:", request.method)
        print("Données reçues:", request.data)
        
        user = CustomUser.objects.get(id=user_id)
        print(f"Utilisateur trouvé: {user.email}")

        if request.method == 'PATCH':
            # Update user fields
            if 'username' in request.data:
                user.username = request.data['username']
            if 'email' in request.data:
                user.email = request.data['email']
            if 'role' in request.data:
                user.role = request.data['role']
            if 'is_active' in request.data:
                print(f"Mise à jour is_active: {request.data['is_active']}")
                user.is_active = bool(request.data['is_active'])
            if 'password' in request.data and request.data['password']:
                user.set_password(request.data['password'])
            
            print(f"État avant sauvegarde - is_active: {user.is_active}")
            user.save()
            print(f"État après sauvegarde - is_active: {user.is_active}")
            
            # Log the action
            AdminLog.objects.create(
                admin=request.user.adminuser,
                action='MANAGE_USER',
                details={'action': 'update', 'user_id': user_id, 'changes': request.data}
            )
            
            return Response({'message': 'User updated successfully'})
            
        elif request.method == 'DELETE':
            user.delete()
            
            # Log the action
            AdminLog.objects.create(
                admin=request.user.adminuser,
                action='MANAGE_USER',
                details={'action': 'delete', 'user_id': user_id}
            )
            
            return Response({'message': 'User deleted successfully'})
            
    except CustomUser.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Error in admin_user_detail: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing the request'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_user_create(request):
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        role = request.data.get('role', 'student')
        
        if not email or not password:
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if CustomUser.objects.filter(email=email).exists():
            return Response(
                {'error': 'User with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = CustomUser.objects.create_user(
            email=email,
            password=password,
            role=role,
            is_active=True,
            email_verified=True
        )
        
        # Log the action
        AdminLog.objects.create(
            admin=request.user.adminuser,
            action='MANAGE_USER',
            details={'action': 'create', 'user_id': user.id, 'email': email, 'role': role}
        )
        
        return Response({
            'message': 'User created successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"Error in admin_user_create: {str(e)}")
        return Response(
            {'error': 'An error occurred while creating the user'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_quizzes(request):
    try:
        quizzes = Quiz.objects.all().select_related('module')
        quiz_data = [{
            'id': quiz.id,
            'titre': quiz.titre,
            'description': quiz.description,
            'date_creation': quiz.date_creation,
            'module_name': quiz.module.display_name if hasattr(quiz.module, 'display_name') else (quiz.module.name if hasattr(quiz.module, 'name') else 'N/A')
        } for quiz in quizzes]
        return Response(quiz_data)
    except Exception as e:
        print(f"Error in admin_quizzes: {str(e)}")
        return Response(
            {'error': 'An error occurred while loading quizzes'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_quiz_history(request):
    try:
        results = QuizResult.objects.all().select_related('student', 'quiz')
        history_data = [{
            'id': result.id,
            'student': result.student.email,
            'quiz_title': result.quiz.titre,
            'score': result.score,
            'total_questions': result.total_questions,
            'date_taken': result.date_taken
        } for result in results]
        return Response(history_data)
    except Exception as e:
        print(f"Error in admin_quiz_history: {str(e)}")
        return Response(
            {'error': 'An error occurred while loading quiz history'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 
