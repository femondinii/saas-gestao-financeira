from django.test import TestCase
from django.contrib.auth import get_user_model
from finance.models import AIPlan

User = get_user_model()

class AIPlanModelTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            email="alice@example.com",
            password="123456",
            name="Alice"
        )

    def test_create_aiplan_with_minimum_and_defaults(self):
        plan = AIPlan.objects.create(user=self.user, title="My first plan")

        self.assertIsNotNone(plan.id)
        self.assertEqual(plan.user, self.user)
        self.assertEqual(plan.title, "My first plan")
        self.assertEqual(plan.template, "")
        self.assertEqual(plan.objective, "")
        self.assertEqual(plan.spec, {})
        self.assertEqual(plan.model, "")
        self.assertAlmostEqual(plan.temperature, 0.4)
        self.assertEqual(plan.tokens, 0)
        self.assertIsNotNone(plan.created_at)
        self.assertIsNotNone(plan.updated_at)

    def test_related_name_works(self):
        AIPlan.objects.create(user=self.user, title="A")
        AIPlan.objects.create(user=self.user, title="B")
        self.assertEqual(self.user.ai_plans.count(), 2)

    def test_default_dict_is_not_shared(self):
        p1 = AIPlan.objects.create(user=self.user, title="P1")
        p1.spec["a"] = 1
        p1.save()

        p2 = AIPlan.objects.create(user=self.user, title="P2")
        self.assertEqual(p2.spec, {})
