from rest_framework.test import APITestCase

class UserAPITest(APITestCase):
    def test_teacher_registration(self):
        data = {
            'username': 'teacher1',
            'email': 't@ecole.fr',
            'password': 'pass123',
            'role': 'TEACHER'
        }
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, 201)