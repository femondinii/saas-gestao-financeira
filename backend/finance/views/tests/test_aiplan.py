from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from finance.models.aiplan import AIPlan
from finance.views.aiplan import AIPlanViewSet, IsOwner

User = get_user_model()

class IsOwnerPermissionTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(email="u1@example.com", password="123", name="U1")
        self.user2 = User.objects.create_user(email="u2@example.com", password="123", name="U2")
        self.plan = AIPlan.objects.create(user=self.user1, title="Plan 1")

    def test_is_owner_returns_true_for_owner(self):
        request = RequestFactory().get("/fake/")
        request.user = self.user1

        perm = IsOwner()
        self.assertTrue(perm.has_object_permission(request, None, self.plan))

    def test_is_owner_returns_false_for_other_user(self):
        request = RequestFactory().get("/fake/")
        request.user = self.user2

        perm = IsOwner()
        self.assertFalse(perm.has_object_permission(request, None, self.plan))


class AIPlanViewSetTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user1 = User.objects.create_user(email="u1@example.com", password="123", name="U1")
        self.user2 = User.objects.create_user(email="u2@example.com", password="123", name="U2")
        self.plan_user1 = AIPlan.objects.create(user=self.user1, title="Plano U1")
        self.plan_user2 = AIPlan.objects.create(user=self.user2, title="Plano U2")

    def test_get_queryset_returns_only_authenticated_user_plans(self):
        view = AIPlanViewSet.as_view({"get": "list"})
        request = self.factory.get("/aiplans/")
        force_authenticate(request, user=self.user1)

        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], self.plan_user1.id)

    def test_create_sets_user_in_perform_create(self):
        view = AIPlanViewSet.as_view({"post": "create"})
        payload = {
            "title": "Novo Plano",
            "template": "",
            "objective": "",
            "spec": {},
            "model": "",
            "temperature": 0.4,
            "tokens": 0,
        }

        request = self.factory.post("/aiplans/", payload, format="json")
        force_authenticate(request, user=self.user1)

        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        created = AIPlan.objects.get(id=response.data["id"])
        self.assertEqual(created.user, self.user1)
        self.assertEqual(created.title, "Novo Plano")

    def test_user_cannot_see_other_users_plan(self):
        view = AIPlanViewSet.as_view({"get": "list"})
        request = self.factory.get("/aiplans/")
        force_authenticate(request, user=self.user2)

        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.plan_user2.id, ids)
        self.assertNotIn(self.plan_user1.id, ids)
