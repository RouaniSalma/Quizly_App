# views.py
from django.shortcuts import render
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser
from .serializers import (UserSerializer, LoginSerializer, 
                         VerifyEmailSerializer, ResendVerificationSerializer)
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'User created successfully. Please check your email for verification.',
                'email': user.email
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        print("=== DEBUG LOGIN ===")
        print("Request data:", request.data)
        print("Email received:", request.data.get('email'))
        print("Password received:", "***" if request.data.get('password') else "None")
        
        serializer = LoginSerializer(data=request.data, context={'request': request})
        
        try:
            print("Validating serializer...")
            serializer.is_valid(raise_exception=True)
            print("Serializer valid!")
            user = serializer.validated_data['user']
            print(f"User found: {user.email}, Role: {user.role}, Active: {user.is_active}")
        except Exception as e:
            print(f"Serializer error: {str(e)}")
            return Response({"detail": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
            
        return Response({
            'access': serializer.validated_data['access'],
            'refresh': serializer.validated_data['refresh'],
            'user': {
                'id': serializer.validated_data['user'].id,
                'email': serializer.validated_data['user'].email,
                'role': serializer.validated_data['user'].role
            }
        }, status=status.HTTP_200_OK)
    
# views.py
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import redirect
from django.conf import settings

class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        token = request.GET.get('token')
        
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = CustomUser.objects.get(verification_token=token)
            
            # Vérification de l'expiration du token (24h)
            if user.token_created_at < timezone.now() - timedelta(hours=24):
                # Redirection vers la page d'expiration
                frontend_url = f"{settings.FRONTEND_URL}/verify-email-notice?expired=true&email={user.email}"
                return redirect(frontend_url)
            
            # Activation de l'utilisateur
            user.is_active = True
            user.email_verified = True
            user.verification_token = None
            user.token_created_at = None
            user.save()
            
            # Redirection vers le frontend avec succès
            frontend_url = f"{settings.FRONTEND_URL}/verify-email-notice?success=true&email={user.email}"
            return redirect(frontend_url)
            
        except CustomUser.DoesNotExist:
            # Redirection vers la page d'erreur
            frontend_url = f"{settings.FRONTEND_URL}/verify-email-notice?error=true"
            return redirect(frontend_url)

class ResendVerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        
        try:
            user = CustomUser.objects.get(email=email)
            
            if user.email_verified:
                return Response({'message': 'Email is already verified'}, 
                              status=status.HTTP_200_OK)
            
            # Generate new token
            token = user.generate_verification_token()
            verification_url = request.build_absolute_uri(
                reverse('verify-email') + f'?token={token}'
            )
            
            send_mail(
                'Verify Your Email Address',
                f'Please click the following link to verify your email: {verification_url}',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            
            return Response({'message': 'Verification email resent successfully'}, 
                          status=status.HTTP_200_OK)
            
        except CustomUser.DoesNotExist:
            return Response({'error': 'User with this email does not exist'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
#### Password functions
from rest_framework.generics import GenericAPIView
from .serializers import (
    PasswordResetRequestSerializer, 
    PasswordResetConfirmSerializer,
    PasswordResetSerializer
)
import uuid
from .models import PasswordResetToken  # Ajoutez cette ligne en haut du fichier
class PasswordResetRequestView(GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = CustomUser.objects.get(email=email)
            # Créer ou mettre à jour le token
            token = str(uuid.uuid4())
            PasswordResetToken.objects.filter(user=user).delete()
            PasswordResetToken.objects.create(user=user, token=token)
            
            # Envoyer l'email
            reset_url = f"{settings.FRONTEND_URL}/password-reset?token={token}"
            
            send_mail(
                'Password Reset Request',
                f'Click the following link to reset your password: {reset_url}\n\n'
                f'This link will expire in 24 hours.',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            
            return Response({'message': 'Password reset link sent to your email'}, 
                          status=status.HTTP_200_OK)
            
        except CustomUser.DoesNotExist:
            return Response({'message': 'If this email exists, a reset link has been sent'},
                          status=status.HTTP_200_OK)

from django.shortcuts import redirect

# Dans views.py
class PasswordResetConfirmView(GenericAPIView):
    def get(self, request):
        token = request.GET.get('token')
        
        if not token:
            return Response({'status': 'invalid'}, status=400)
        
        try:
            reset_token = PasswordResetToken.objects.get(token=token)
            
            if reset_token.used or reset_token.created_at < timezone.now() - timedelta(hours=24):
                return Response({'status': 'expired'}, status=400)
                
            return Response({'status': 'valid', 'token': token}, status=200)
            
        except PasswordResetToken.DoesNotExist:
            return Response({'status': 'invalid'}, status=400)

class PasswordResetView(GenericAPIView):
    serializer_class = PasswordResetSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            reset_token = PasswordResetToken.objects.get(token=serializer.validated_data['token'])
            if not reset_token.is_valid():
                return Response({'error': 'Invalid or expired token'},
                              status=status.HTTP_400_BAD_REQUEST)
            
            user = reset_token.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            reset_token.used = True
            reset_token.save()
            
            
            
            return Response({'message': 'Password reset successfully'},
                          status=status.HTTP_200_OK)
            
        except PasswordResetToken.DoesNotExist:
            return Response({'error': 'Invalid token'},
                          status=status.HTTP_400_BAD_REQUEST)
    def get(self, request, token):
      try:
        reset_token = PasswordResetToken.objects.get(token=token)
        if not reset_token.is_valid():
            return Response({'valid': False, 'message': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'valid': True})
      except PasswordResetToken.DoesNotExist:
        return Response({'valid': False, 'message': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)    