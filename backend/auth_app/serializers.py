# serializers.py
from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'email', 'password', 'role']
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True}
        }

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'student'),
            is_active=False  # User inactive until email verification
        )
        
        # Generate and send verification email
        token = user.generate_verification_token()
        verification_url = self.context['request'].build_absolute_uri(
            reverse('verify-email') + f'?token={token}'
        )
        
        send_mail(
            'Verify Your Email Address',
            f'Please click the following link to verify your email: {verification_url}',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            user = authenticate(request=self.context.get('request'),
                               email=email, password=password)
            
            if user:
                if not user.is_active:
                    raise serializers.ValidationError("Your account is not active. Please verify your email first.")
                if not user.email_verified:
                    raise serializers.ValidationError("Please verify your email address before logging in.")
                return {
                    'user': user,
                    'access': str(RefreshToken.for_user(user).access_token),
                    'refresh': str(RefreshToken.for_user(user))
                }
            else:
                raise serializers.ValidationError("Unable to log in with provided credentials.")
        else:
            raise serializers.ValidationError("Must include 'email' and 'password'.")

class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField()

class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()