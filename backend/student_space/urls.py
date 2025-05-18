from django.urls import path
from . import views

urlpatterns = [
 path('after-login/', views.after_login_redirect, name='after_login'),
    
    # Endpoints pour les catégories/modules étudiants
    path('categories/', views.student_categories, name='student_categories'),
    path('categories/check/', views.check_student_categories, name='check_student_categories'),
    path('categories/create/', views.create_category, name='create_category'),
    path('categories/<int:pk>/', views.category_detail, name='category-detail'),
    path('categories/<int:module_id>/upload/', views.upload_pdfs, name='upload-pdfs'),
    path('api/student/categories/<int:id>/pdfs/', views.module_pdfs, name='module-pdfs'),
    path('api/student/categories/<int:module_id>/pdfs/<int:pdf_id>/', views.delete_pdf, name='delete-pdf'),
    path('categories/<int:module_id>/generate_quiz/', views.generate_quiz, name='generate-quiz'),
]