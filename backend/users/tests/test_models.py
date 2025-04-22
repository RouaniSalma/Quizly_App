from django.test import TestCase
from users.models import User

class UserModelTest(TestCase):
    def test_create_student(self):
        user = User.objects.create_user(
            username='student1',
            role='STUDENT'
        )
        self.assertEqual(user.role, 'STUDENT')