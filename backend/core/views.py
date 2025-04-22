# views.py
from django.shortcuts import render, redirect
from .forms import UserRegisterForm, StudentForm, TeacherForm, AdminForm
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required

@login_required
def home_view(request):
    # Assurer que l'utilisateur est authentifié
    return render(request, 'home.html')


def register(request):
    if request.method == 'POST':
        user_form = UserRegisterForm(request.POST)
        role = request.POST.get('role')  # 'student', 'teacher', 'admin'
        
        if user_form.is_valid():
            user = user_form.save()

            # Assigner un rôle en fonction de l'entrée
            if role == 'student':
                student_form = StudentForm(request.POST)
                if student_form.is_valid():
                    student = student_form.save(commit=False)
                    student.user = user
                    student.save()
                    user.is_student = True
                    user.save()

            elif role == 'teacher':
                teacher_form = TeacherForm(request.POST)
                if teacher_form.is_valid():
                    teacher = teacher_form.save(commit=False)
                    teacher.user = user
                    teacher.save()
                    user.is_teacher = True
                    user.save()

            elif role == 'admin':
                admin_form = AdminForm(request.POST)
                if admin_form.is_valid():
                    admin = admin_form.save(commit=False)
                    admin.user = user
                    admin.save()
                    user.is_admin = True
                    user.save()

            # Connexion automatique après l'enregistrement
            login(request, user)
            return redirect('home')  # Rediriger vers la page d'accueil ou tableau de bord
    else:
        user_form = UserRegisterForm()
    
    return render(request, 'register.html', {'user_form': user_form})

#def home_view(request):
  #  return render(request, 'home.html')

# views.py
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib.auth.forms import AuthenticationForm

def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            # Récupérer l'utilisateur et le connecter
            user = form.get_user()
            login(request, user)
            return redirect('home')  # Rediriger vers la page d'accueil après connexion
    else:
        form = AuthenticationForm()
    return render(request, 'login.html', {'form': form})
