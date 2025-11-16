from datetime import date, timedelta
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate
from finance.models.wallet import Wallet
from finance.models.category import Category
from finance.models.transaction import Transaction
from finance.views.transaction import TransactionViewSet

User = get_user_model()

class TransactionViewSetTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(email="user@example.com", password="123", name="User")
        self.other = User.objects.create_user(email="other@example.com", password="123", name="Other")

        self.wallet1 = Wallet.objects.create(user=self.user, name="W1")
        self.wallet2 = Wallet.objects.create(user=self.user, name="W2")
        self.wallet_other = Wallet.objects.create(user=self.other, name="W3")

        self.cat_food = Category.objects.create(user=self.user, name="Food")
        self.cat_salary = Category.objects.create(user=self.user, name="Salary")
        self.cat_transfer = Category.objects.create(user=None, name="Transferência", is_system=True)

        today = date.today()
        yesterday = today - timedelta(days=1)

        self.tx_income = Transaction.objects.create(
            user=self.user,
            wallet=self.wallet1,
            type=Transaction.Type.INCOME,
            category=self.cat_salary,
            amount=Decimal("100.00"),
            date=today,
            description="salary",
        )
        self.tx_expense = Transaction.objects.create(
            user=self.user,
            wallet=self.wallet1,
            type=Transaction.Type.EXPENSE,
            category=self.cat_food,
            amount=Decimal("30.00"),
            date=yesterday,
            description="market",
        )
        self.tx_archived = Transaction.objects.create(
            user=self.user,
            wallet=self.wallet2,
            type=Transaction.Type.EXPENSE,
            category=self.cat_food,
            amount=Decimal("10.00"),
            is_archived=True,
            description="archived",
        )
        self.tx_other_user = Transaction.objects.create(
            user=self.other,
            wallet=self.wallet_other,
            type=Transaction.Type.EXPENSE,
            category=self.cat_food,
            amount=Decimal("5.00"),
            description="other user",
        )
        self.tx_transfer = Transaction.objects.create(
            user=self.user,
            wallet=self.wallet1,
            type=Transaction.Type.EXPENSE,
            category=self.cat_transfer,
            amount=Decimal("20.00"),
            date=today,
            description="transfer out",
        )

    def _view(self, action_map):
        return TransactionViewSet.as_view(action_map)

    def _auth_get(self, url, params=None):
        req = self.factory.get(url, data=params or {})
        force_authenticate(req, user=self.user)
        return req

    def _auth_post(self, url, data=None):
        req = self.factory.post(url, data=data or {}, format="json")
        force_authenticate(req, user=self.user)
        return req

    def _auth_delete(self, url, data=None):
        req = self.factory.delete(url, data=data or {}, format="json")
        force_authenticate(req, user=self.user)
        return req

    def test_get_queryset_basic_filters_and_ordering(self):
        view = self._view({"get": "list"})
        params = {
            "date_start": date.today().isoformat(),
            "type": "income",
            "wallet_id": str(self.wallet1.id),
        }
        req = self._auth_get("/transactions/", params)
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ids = [row["id"] for row in resp.data["results"]]
        self.assertIn(self.tx_income.id, ids)
        self.assertNotIn(self.tx_expense.id, ids)
        self.assertNotIn(self.tx_archived.id, ids)
        self.assertNotIn(self.tx_other_user.id, ids)

    def test_get_queryset_is_archived_true(self):
        view = self._view({"get": "list"})
        req = self._auth_get("/transactions/", {"is_archived": "true"})
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ids = [row["id"] for row in resp.data["results"]]
        self.assertIn(self.tx_archived.id, ids)
        self.assertNotIn(self.tx_income.id, ids)

    def test_get_queryset_search_and_invalid_ordering(self):
        view = self._view({"get": "list"})
        req = self._auth_get("/transactions/", {"q": "market", "ordering": "invalid"})
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ids = [row["id"] for row in resp.data["results"]]
        self.assertIn(self.tx_expense.id, ids)
        self.assertNotIn(self.tx_income.id, ids)

    def test_perform_create_sets_user(self):
        view = self._view({"post": "create"})
        payload = {
            "type": Transaction.Type.EXPENSE,
            "wallet": self.wallet1.id,
            "category": self.cat_food.id,
            "amount": "12.34",
            "description": "test create",
        }
        req = self._auth_post("/transactions/", payload)
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        created_id = resp.data["id"]
        created = Transaction.objects.get(id=created_id)
        self.assertEqual(created.user, self.user)

    def test_bulk_delete_invalid_ids(self):
        view = self._view({"delete": "bulk_delete"})
        req = self._auth_delete("/transactions/bulk/", {"ids": ["abc"]})
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bulk_delete_no_ids(self):
        view = self._view({"delete": "bulk_delete"})
        req = self._auth_delete("/transactions/bulk/", {})
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bulk_delete_valid_ids(self):
        view = self._view({"delete": "bulk_delete"})
        ids = [self.tx_income.id, self.tx_expense.id, self.tx_other_user.id]
        req = self._auth_delete("/transactions/bulk/", {"ids": ids})
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["deleted"], 2)
        remaining_ids = list(Transaction.objects.filter(user=self.user).values_list("id", flat=True))
        self.assertNotIn(self.tx_income.id, remaining_ids)
        self.assertNotIn(self.tx_expense.id, remaining_ids)

    def test_stats_basic(self):
        view = self._view({"get": "stats"})
        req = self._auth_get("/transactions/stats/")
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("balance", resp.data)
        self.assertIn("net_worth", resp.data)
        self.assertIn("income", resp.data)
        self.assertIn("expenses", resp.data)

    def test_stats_with_wallet_filter(self):
        view = self._view({"get": "stats"})
        req = self._auth_get("/transactions/stats/", {"wallet_id": str(self.wallet1.id)})
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_monthly_with_invalid_months_param(self):
        view = self._view({"get": "monthly"})
        req = self._auth_get("/transactions/monthly/", {"months": "xyz"})
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("months", resp.data)

    def test_monthly_with_valid_months_param(self):
        view = self._view({"get": "monthly"})
        req = self._auth_get("/transactions/monthly/", {"months": "3"})
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("months", resp.data)

    def test_expenses_by_category_default_period(self):
        view = self._view({"get": "expenses_by_category"})
        req = self._auth_get("/transactions/expenses-by-category/")
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("items", resp.data)
        self.assertIn("period", resp.data)

    def test_expenses_by_category_custom_period(self):
        view = self._view({"get": "expenses_by_category"})
        today = date.today()
        params = {"year": str(today.year), "month": str(today.month)}
        req = self._auth_get("/transactions/expenses-by-category/", params)
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_balance_series_default(self):
        view = self._view({"get": "balance_series"})
        req = self._auth_get("/transactions/balance-series/")
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("months", resp.data)
        self.assertIn("opening_balance", resp.data)

    def test_balance_series_with_wallet_filter_and_months_param(self):
        view = self._view({"get": "balance_series"})
        req = self._auth_get(
            "/transactions/balance-series/",
            {"wallet_id": str(self.wallet1.id), "months": "2"},
        )
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_income_by_source_default_period(self):
        view = self._view({"get": "income_by_source"})
        req = self._auth_get("/transactions/income-by-source/")
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("items", resp.data)
        self.assertIn("period", resp.data)

    def test_income_by_source_custom_period(self):
        view = self._view({"get": "income_by_source"})
        today = date.today()
        params = {"year": str(today.year), "month": str(today.month)}
        req = self._auth_get("/transactions/income-by-source/", params)
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_recent_default_limit(self):
        view = self._view({"get": "recent"})
        req = self._auth_get("/transactions/recent/")
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(len(resp.data) >= 1)

    def test_recent_invalid_limit_param(self):
        view = self._view({"get": "recent"})
        req = self._auth_get("/transactions/recent/", {"limit": "abc"})
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_recent_respects_max_limit(self):
        view = self._view({"get": "recent"})
        req = self._auth_get("/transactions/recent/", {"limit": "1000"})
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_transfer_invalid_amount(self):
        view = self._view({"post": "transfer"})
        req = self._auth_post("/transactions/transfer/", {"amount": "abc"})
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_transfer_non_positive_amount(self):
        view = self._view({"post": "transfer"})
        req = self._auth_post(
            "/transactions/transfer/",
            {"amount": "0", "from_wallet_id": self.wallet1.id, "to_wallet_id": self.wallet2.id},
        )
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_transfer_missing_wallets(self):
        view = self._view({"post": "transfer"})
        req = self._auth_post("/transactions/transfer/", {"amount": "10"})
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_transfer_same_wallet(self):
        view = self._view({"post": "transfer"})
        req = self._auth_post(
            "/transactions/transfer/",
            {"amount": "10", "from_wallet_id": self.wallet1.id, "to_wallet_id": self.wallet1.id},
        )
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_transfer_wallet_not_found(self):
        view = self._view({"post": "transfer"})
        req = self._auth_post(
            "/transactions/transfer/",
            {"amount": "10", "from_wallet_id": 999, "to_wallet_id": self.wallet2.id},
        )
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_transfer_invalid_date(self):
        view = self._view({"post": "transfer"})
        req = self._auth_post(
            "/transactions/transfer/",
            {
                "amount": "10",
                "from_wallet_id": self.wallet1.id,
                "to_wallet_id": self.wallet2.id,
                "date": "invalid",
            },
        )
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_transfer_success(self):
        view = self._view({"post": "transfer"})
        payload = {
            "amount": "50.00",
            "from_wallet_id": self.wallet1.id,
            "to_wallet_id": self.wallet2.id,
            "description": "Transfer test",
        }
        req = self._auth_post("/transactions/transfer/", payload)
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        created = resp.data["created"]
        self.assertEqual(len(created), 2)
        ids = [row["id"] for row in created]
        self.assertEqual(Transaction.objects.filter(id__in=ids).count(), 2)

    def test_get_queryset_date_end_filter(self):
        view = self._view({"get": "list"})
        end = date.today().isoformat()
        req = self._auth_get("/transactions/", {"date_end": end})
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_get_queryset_category_filter(self):
        view = self._view({"get": "list"})
        req = self._auth_get("/transactions/", {"category_id": self.cat_food.id})
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ids = [row["id"] for row in resp.data["results"]]
        self.assertIn(self.tx_expense.id, ids)

    def test_stats_pct_change_with_prev_nonzero(self):
        Transaction.objects.create(
            user=self.user,
            wallet=self.wallet1,
            type=Transaction.Type.INCOME,
            category=self.cat_salary,
            amount=Decimal("50.00"),
            date=date.today().replace(day=1) - timedelta(days=35),
        )

        view = self._view({"get": "stats"})
        req = self._auth_get("/transactions/stats/")
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_stats_filters_by_wallet(self):
        view = self._view({"get": "stats"})
        req = self._auth_get("/transactions/stats/", {"wallet_id": str(self.wallet1.id)})
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_monthly_backward_year_adjustment(self):
        view = self._view({"get": "monthly"})
        req = self._auth_get("/transactions/monthly/", {"months": "20"})
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_monthly_loop_wraps_to_next_year(self):
        view = self._view({"get": "monthly"})
        req = self._auth_get("/transactions/monthly/", {"months": "13"})
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_expenses_by_category_filter_wallet(self):
        view = self._view({"get": "expenses_by_category"})
        req = self._auth_get("/transactions/expenses-by-category/", {"wallet_id": self.wallet1.id})
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_balance_series_backward_year_adjustment(self):
        view = self._view({"get": "balance_series"})
        req = self._auth_get("/transactions/balance-series/", {"months": "20"})
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_income_by_source_filter_wallet(self):
        view = self._view({"get": "income_by_source"})
        req = self._auth_get("/transactions/income-by-source/", {"wallet_id": self.wallet1.id})
        resp = view(req)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)





