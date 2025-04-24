from django.shortcuts import render

def index(request):
    return render(request, 'index.html')  # pas besoin d'ajouter le chemin complet ici
