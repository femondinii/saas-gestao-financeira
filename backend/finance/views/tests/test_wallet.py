from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from finance.models.wallet import Wallet
from finance.models.transaction import Transaction
from finance.views.wallet import WalletViewSet

User = get_user_model()

class WalletViewSetTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(email="user@example.com", password="123", name="User")
        self.other = User.objects.create_user(email="other@example.com", password="123", name="Other")

        self.w1 = Wallet.objects.create(user=self.user, name="A Wallet", kind=Wallet.Kind.CHECKING, initial_balance=Decimal("100.00"))
        self.w2 = Wallet.objects.create(user=self.user, name="B Wallet", kind=Wallet.Kind.CHECKING, initial_balance=Decimal("0.00"))
        self.w_archived = Wallet.objects.create(user=self.user, name="Archived", kind=Wallet.Kind.CHECKING, is_archived=True)
        self.w_other = Wallet.objects.create(user=self.other, name="Other User Wallet", kind=Wallet.Kind.CHECKING)

        Transaction.objects.create(user=self.user, wallet=self.w1, type=Transaction.Type.INCOME, amount=Decimal("50.00"))
        Transaction.objects.create(user=self.user, wallet=self.w1, type=Transaction.Type.EXPENSE, amount=Decimal("20.00"))
        Transaction.objects.create(user=self.user, wallet=self.w2, type=Transaction.Type.EXPENSE, amount=Decimal("10.00"))

    def test_get_queryset_only_user_non_archived_and_ordered(self):
        view = WalletViewSet.as_view({"get": "list"})
        request = self.factory.get("/wallets/")
        force_authenticate(request, user=self.user)

        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        names = [w["name"] for w in response.data["results"]]
        self.assertEqual(names, sorted(names))
        self.assertIn("A Wallet", names)
        self.assertIn("B Wallet", names)
        self.assertNotIn("Archived", names)
        self.assertNotIn("Other User Wallet", names)

    def test_perform_create_sets_user(self):
        view = WalletViewSet.as_view({"post": "create"})
        payload = {
            "name": "New Wallet",
            "kind": Wallet.Kind.CHECKING,
            "initial_balance": "25.00",
            "color": "#000000",
        }
        request = self.factory.post("/wallets/", payload, format="json")
        force_authenticate(request, user=self.user)

        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        created = Wallet.objects.get(pk=response.data["id"])
        self.assertEqual(created.user, self.user)
        self.assertEqual(created.name, "New Wallet")

    def test_total_balance_uses_current_balance_and_filters_non_archived(self):
        view = WalletViewSet.as_view({"get": "total_balance"})
        request = self.factory.get("/wallets/total-balance/")
        force_authenticate(request, user=self.user)

        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertIn("total_balance", response.data)
        self.assertIn("wallets", response.data)

        wallets_data = response.data["wallets"]
        ids = [w["id"] for w in wallets_data]
        self.assertIn(self.w1.id, ids)
        self.assertIn(self.w2.id, ids)
        self.assertNotIn(self.w_archived.id, ids)
        self.assertNotIn(self.w_other.id, ids)

        w1_cb = Decimal(next(w["current_balance"] for w in wallets_data if w["id"] == self.w1.id))
        w2_cb = Decimal(next(w["current_balance"] for w in wallets_data if w["id"] == self.w2.id))
        expected_total = w1_cb + w2_cb
        self.assertEqual(Decimal(response.data["total_balance"]), expected_total)

    def test_archive_sets_is_archived_true_and_returns_data(self):
        view = WalletViewSet.as_view({"post": "archive"})
        request = self.factory.post(f"/wallets/{self.w1.pk}/archive/")
        force_authenticate(request, user=self.user)

        response = view(request, pk=self.w1.pk)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.w1.refresh_from_db()
        self.assertTrue(self.w1.is_archived)
        self.assertEqual(response.data["id"], self.w1.id)

    def test_archived_wallet_not_in_queryset_after_archive(self):
        view_archive = WalletViewSet.as_view({"post": "archive"})
        req_archive = self.factory.post(f"/wallets/{self.w2.pk}/archive/")
        force_authenticate(req_archive, user=self.user)
        view_archive(req_archive, pk=self.w2.pk)

        view_list = WalletViewSet.as_view({"get": "list"})
        req_list = self.factory.get("/wallets/")
        force_authenticate(req_list, user=self.user)

        response = view_list(req_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [w["id"] for w in response.data["results"]]
        self.assertNotIn(self.w2.id, ids)
