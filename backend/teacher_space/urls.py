from teacher_space.views import after_login_redirect
from django.urls import path
from . import views
urlpatterns = [
    path('after-login/', after_login_redirect, name='after_login'),
    path('modules/check/', views.check_teacher_modules, name='check_teacher_modules'),
    path('modules/create/', views.create_module, name='create_module'),
     path('modules/', views.teacher_modules, name='teacher_modules'),
    # autres urls
]
