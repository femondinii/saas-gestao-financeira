from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from finance.models.category import Category
from finance.views.category import CategoryViewSet, IsOwner

User = get_user_model()

class CategoryIsOwnerTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(email="u1@example.com", password="123", name="U1")
        self.user2 = User.objects.create_user(email="u2@example.com", password="123", name="U2")
        self.cat = Category.objects.create(user=self.user1, name="Food")
        self.rf = RequestFactory()

    def test_is_owner_true_for_owner(self):
        req = self.rf.get("/fake/")
        req.user = self.user1
        perm = IsOwner()
        self.assertTrue(perm.has_object_permission(req, None, self.cat))

    def test_is_owner_false_for_other_user(self):
        req = self.rf.get("/fake/")
        req.user = self.user2
        perm = IsOwner()
        self.assertFalse(perm.has_object_permission(req, None, self.cat))

class CategoryViewSetTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(email="user@example.com", password="123", name="User")
        self.other = User.objects.create_user(email="other@example.com", password="123", name="Other")

        self.cat_user = Category.objects.create(user=self.user, name="User Cat", is_archived=False)
        self.cat_global = Category.objects.create(user=None, name="Global Cat", is_archived=False)
        self.cat_other = Category.objects.create(user=self.other, name="Other Cat", is_archived=False)
        self.cat_archived = Category.objects.create(user=self.user, name="Archived Cat", is_archived=True)

    def test_get_queryset_filters_by_user_and_global_and_not_archived(self):
        view = CategoryViewSet.as_view({"get": "list"})
        request = self.factory.get("/categories/")
        force_authenticate(request, user=self.user)

        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        names = [c["name"] for c in response.data["results"]]
        self.assertIn("User Cat", names)
        self.assertIn("Global Cat", names)
        self.assertNotIn("Other Cat", names)
        self.assertNotIn("Archived Cat", names)

    def test_perform_create_sets_user(self):
        view = CategoryViewSet.as_view({"post": "create"})
        payload = {"name": "New Cat"}
        request = self.factory.post("/categories/", payload, format="json")
        force_authenticate(request, user=self.user)

        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        created = Category.objects.get(pk=response.data["id"])
        self.assertEqual(created.user, self.user)
        self.assertEqual(created.name, "New Cat")

    def test_archive_action_sets_is_archived_true_and_returns_data(self):
        view = CategoryViewSet.as_view({"post": "archive"})
        request = self.factory.post(f"/categories/{self.cat_user.pk}/archive/")
        force_authenticate(request, user=self.user)

        response = view(request, pk=self.cat_user.pk)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.cat_user.refresh_from_db()
        self.assertTrue(self.cat_user.is_archived)
        self.assertEqual(response.data["id"], self.cat_user.id)

    def test_archived_category_not_in_queryset_after_archive(self):
        view_archive = CategoryViewSet.as_view({"post": "archive"})
        req_archive = self.factory.post(f"/categories/{self.cat_user.pk}/archive/")
        force_authenticate(req_archive, user=self.user)
        view_archive(req_archive, pk=self.cat_user.pk)

        view_list = CategoryViewSet.as_view({"get": "list"})
        req_list = self.factory.get("/categories/")
        force_authenticate(req_list, user=self.user)

        response = view_list(req_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [c["id"] for c in response.data["results"]]
        self.assertNotIn(self.cat_user.id, ids)
