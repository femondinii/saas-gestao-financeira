from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from finance.models.aiplan import AIPlan
from finance.serializers.aiplan import AIPlanSerializer

User = get_user_model()

class AIPlanSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="user@example.com", password="123", name="User")
        self.factory = RequestFactory()
        self.request = self.factory.post("/fake/")
        self.request.user = self.user

    def test_create_ai_plan_serializer(self):
        data = {
            "title": "Meu Plano",
            "template": "base",
            "objective": "Organizar finanças",
            "spec": {"meta": "teste"},
            "model": "gpt-4",
            "temperature": 0.7,
            "tokens": 1200,
        }
        serializer = AIPlanSerializer(data=data, context={"request": self.request})
        self.assertTrue(serializer.is_valid(), serializer.errors)

        plan = serializer.save()
        self.assertIsInstance(plan, AIPlan)
        self.assertEqual(plan.user, self.user)
        self.assertEqual(plan.title, "Meu Plano")
        self.assertEqual(plan.template, "base")
        self.assertEqual(plan.model, "gpt-4")
