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
        serializer = LoginSerializer(data=request.data, context={'request': request})
        
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
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