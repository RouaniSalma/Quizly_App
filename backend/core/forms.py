from django import forms
from .models import User, Student, Teacher, Admin  # Import des modèles nécessaires

# Formulaire pour l'inscription de l'utilisateur
class UserRegisterForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password'])  # Sécuriser le mot de passe
        if commit:
            user.save()
        return user

# Formulaire pour l'étudiant
class StudentForm(forms.ModelForm):
    class Meta:
        model = Student
        fields = ['niveau']  # Champs du modèle Student (ajouter d'autres champs si nécessaire)

# Formulaire pour le professeur
class TeacherForm(forms.ModelForm):
    class Meta:
        model = Teacher
        fields = ['specialite']  # Champs du modèle Teacher (ajouter d'autres champs si nécessaire)

# Formulaire pour l'administrateur
class AdminForm(forms.ModelForm):
    class Meta:
        model = Admin
        fields = ['departement']  # Champs du modèle Admin (ajouter d'autres champs si nécessaire)

# Formulaire de connexion
class LoginForm(forms.Form):
    username = forms.CharField()
    password = forms.CharField(widget=forms.PasswordInput)