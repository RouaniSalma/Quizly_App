from rest_framework import serializers
from teacher_space.models import Quiz, Question, Choix

class SharedQuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = ['id', 'titre', 'description', 'date_creation']

class SharedQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'enonce']

class SharedChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choix
        fields = ['id', 'texte']

class SharedQuizDetailSerializer(serializers.ModelSerializer):
    questions = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = ['id', 'titre', 'description', 'questions']

    def get_questions(self, obj):
        questions = obj.questions.all()
        return [
            {
                'id': q.id,
                'text': q.enonce,
                'choices': [
                    {'id': c.id, 'text': c.texte}
                    for c in q.choix.all()
                ]
            }
            for q in questions
        ]