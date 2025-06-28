from django.urls import path
from .views import RegisterView, LoginView, VerifyEmailView, ResendVerificationView,PasswordResetConfirmView,PasswordResetRequestView,PasswordResetView
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


urlpatterns = [
    path('signup/', RegisterView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),
    path('password/reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('password/reset/complete/', PasswordResetView.as_view(), name='password-reset-complete'),
    ####Adde for refrech token
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('password/reset/verify-token/<str:token>/', PasswordResetView.as_view(), name='password-reset-verify-token'),
]
