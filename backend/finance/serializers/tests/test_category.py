from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from finance.models.category import Category
from finance.serializers.category import CategorySerializer

User = get_user_model()

class CategorySerializerTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(email="u@example.com", password="123", name="U")
        self.other = User.objects.create_user(email="o@example.com", password="123", name="O")
        self.req = self.factory.post("/fake/")
        self.req.user = self.user

    def test_create_sets_user(self):
        ser = CategorySerializer(data={"name": "Bills"}, context={"request": self.req})
        self.assertTrue(ser.is_valid(), ser.errors)
        obj = ser.save()
        self.assertIsInstance(obj, Category)
        self.assertEqual(obj.user, self.user)
        self.assertEqual(obj.name, "Bills")

    def test_validate_name_blocks_duplicate_for_same_user_case_insensitive(self):
        Category.objects.create(user=self.user, name="Travel", is_archived=False)
        ser = CategorySerializer(data={"name": "travel"}, context={"request": self.req})
        self.assertFalse(ser.is_valid())
        self.assertIn("name", ser.errors)
        self.assertIn("Já existe uma categoria", ser.errors["name"][0])

    def test_validate_name_blocks_duplicate_global(self):
        Category.objects.create(user=None, name="Groceries", is_archived=False)
        ser = CategorySerializer(data={"name": "groceries"}, context={"request": self.req})
        self.assertFalse(ser.is_valid())
        self.assertIn("name", ser.errors)

    def test_validate_name_allows_duplicate_if_archived(self):
        Category.objects.create(user=self.user, name="Bills", is_archived=True)
        ser = CategorySerializer(data={"name": "bills"}, context={"request": self.req})
        self.assertTrue(ser.is_valid(), ser.errors)

    def test_validate_name_excludes_self_on_update(self):
        obj = Category.objects.create(user=self.user, name="Food", is_archived=False)
        ser = CategorySerializer(instance=obj, data={"name": "Food"}, context={"request": self.req})
        self.assertTrue(ser.is_valid(), ser.errors)

    def test_validate_name_strips_spaces(self):
        ser = CategorySerializer(data={"name": "   Bills  "}, context={"request": self.req})
        self.assertTrue(ser.is_valid(), ser.errors)
        obj = ser.save()
        self.assertEqual(obj.name, "Bills")
