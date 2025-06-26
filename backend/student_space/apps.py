from django.apps import AppConfig


class StudentSpaceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'student_space'
    
    #added student passes quiz teacher
    def ready(self):
        import student_space.signals