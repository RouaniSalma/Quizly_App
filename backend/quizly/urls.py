
from django.urls import path
from . import views

urlpatterns = [
    # ... vos URLs existantes ...
    
    # URLs d'administration
    path('login/', views.admin_login, name='admin_login'),
    path('dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('logs/', views.admin_logs, name='admin_logs'),
    
    # URLs de gestion des utilisateurs
    path('users/', views.admin_users, name='admin_users'),
    path('users/create/', views.admin_user_create, name='admin_user_create'),
    path('users/<int:user_id>/', views.admin_user_detail, name='admin_user_detail'),
    path('quizzes/', views.admin_quizzes, name='admin_quizzes'),
    path('quiz-history/', views.admin_quiz_history, name='admin_quiz_history'),
] 
