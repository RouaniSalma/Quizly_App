from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth import authenticate

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'email', 'password', 'role']  # Retiré username
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
        )
        return user

from rest_framework_simplejwt.tokens import RefreshToken

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()  # Changé de username à email
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')  # Changé de username à email
        password = data.get('password')

        if email and password:
            user = authenticate(request=self.context.get('request'),
                               email=email, password=password)  # Authentification par email
            
            if user:
                if not user.is_active:
                    raise serializers.ValidationError("User account is disabled.")
                return {
                    'user': user,
                    'access': str(RefreshToken.for_user(user).access_token),
                    'refresh': str(RefreshToken.for_user(user))
                }
            else:
                raise serializers.ValidationError("Unable to log in with provided credentials.")
        else:
            raise serializers.ValidationError("Must include 'email' and 'password'.")