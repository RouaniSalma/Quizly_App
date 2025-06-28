from django.urls import path
from . import views

urlpatterns = [
 path('after-login/', views.after_login_redirect, name='after_login'),
    
    # Endpoints pour les catégories/modules étudiants
    path('categories/', views.student_categories, name='student_categories'),
    path('categories/check/', views.check_student_categories, name='check_student_categories'),
    path('categories/create/', views.create_category, name='create_category'),
    path('categories/check-unique/', views.check_category_unique, name='check-category-unique'),
    path('categories/<int:pk>/', views.category_detail, name='category-detail'),
    path('categories/<int:category_id>/update/', views.update_category, name='update_category'),
    path('categories/<int:category_id>/delete/', views.delete_category, name='delete_category'),
    path('categories/<int:module_id>/upload/', views.upload_pdfs, name='upload-pdfs'),
    path('api/student/categories/<int:id>/pdfs/', views.module_pdfs, name='module-pdfs'),
    path('api/student/categories/<int:module_id>/pdfs/<int:pdf_id>/', views.delete_pdf, name='delete-pdf'),
    path('categories/<int:module_id>/generate_quiz/', views.generate_quiz, name='generate-quiz'),
    path('quizzes/<int:quiz_id>/submit/', views.submit_quiz, name='submit_quiz'),
    # NOUVEAUX ENDPOINTS pour l'historique des quiz
    path('categories/<int:module_id>/quizzes/', views.student_module_quizzes, name='student-module-quizzes'),
    # Ajoutez cette route dans urlpatterns
path('categories/<int:module_id>/quiz/<int:quiz_id>/', views.student_quiz_detail, name='student-quiz-detail'),
    path('categories/<int:module_id>/quizzes/<int:quiz_id>/', views.student_quiz_detail, name='student-quiz-detail'),
    path('quizzes/<int:quiz_id>/results/latest/', views.get_latest_quiz_result, name='latest-quiz-result'),
    path('quizzes/<int:quiz_id>/answers/', views.get_user_answers, name='user-quiz-answers'),
    path('categories/<int:module_id>/quizzes/<int:quiz_id>/delete/', views.delete_quiz, name='delete-quiz'),
    #####student passe quiz teacher
    path('shared-quiz/access/', views.access_shared_quiz, name='access_shared_quiz'),
    path('shared-quiz/<int:quiz_id>/submit/', views.submit_shared_quiz, name='submit_shared_quiz'),
    path('shared-quiz/<int:quiz_id>/details/', views.shared_quiz_detail, name='shared-quiz-detail'),
    path('shared-quiz/<int:quiz_id>/delete/', views.delete_shared_quiz_result, name='delete-shared-quiz'),
    path('dashboard/', views.student_quiz_results, name='student_dashboard'),
]