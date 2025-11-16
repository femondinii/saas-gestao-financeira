from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from finance.models.category import Category

User = get_user_model()

class CategoryModelTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.u1 = User.objects.create_user(email="u1@example.com", password="123", name="U1")
        cls.u2 = User.objects.create_user(email="u2@example.com", password="123", name="U2")

    def test_create_basic(self):
        c = Category.objects.create(user=self.u1, name="Food")
        self.assertIsNotNone(c.id)
        self.assertEqual(c.user, self.u1)
        self.assertEqual(c.name, "Food")
        self.assertFalse(c.is_system)
        self.assertFalse(c.is_archived)

    def test_related_name(self):
        Category.objects.create(user=self.u1, name="A")
        Category.objects.create(user=self.u1, name="B")
        self.assertEqual(self.u1.categories.count(), 2)

    def test_ordering_by_name(self):
        Category.objects.create(user=self.u1, name="Bravo")
        Category.objects.create(user=self.u1, name="Alpha")
        names = list(self.u1.categories.values_list("name", flat=True))
        self.assertEqual(names, ["Alpha", "Bravo"])

    def test_user_unique_case_insensitive_active(self):
        Category.objects.create(user=self.u1, name="Travel", is_archived=False)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Category.objects.create(user=self.u1, name="travel", is_archived=False)

        c = Category.objects.create(user=self.u2, name="TRAVEL", is_archived=False)
        self.assertIsNotNone(c.id)

    def test_user_duplicate_allowed_when_archived(self):
        Category.objects.create(user=self.u1, name="Bills", is_archived=False)
        c = Category.objects.create(user=self.u1, name="bills", is_archived=True)
        self.assertIsNotNone(c.id)

    def test_global_unique_case_insensitive_active(self):
        Category.objects.create(user=None, name="Groceries", is_archived=False)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Category.objects.create(user=None, name="groceries", is_archived=False)

        c = Category.objects.create(user=None, name="GROCERIES", is_archived=True)
        self.assertIsNotNone(c.id)

    def test_global_and_user_can_coexist(self):
        g = Category.objects.create(user=None, name="Transport", is_archived=False)
        u = Category.objects.create(user=self.u1, name="transport", is_archived=False)
        self.assertIsNotNone(g.id)
        self.assertIsNotNone(u.id)
