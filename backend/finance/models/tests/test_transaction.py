from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from finance.models.wallet import Wallet
from finance.models.transaction import Transaction

User = get_user_model()

class TransactionSignedAmountTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="t@example.com", password="123", name="Test")
        self.wallet = Wallet.objects.create(user=self.user, name="Main Wallet")

    def test_signed_amount_income(self):
        tx = Transaction.objects.create(
            user=self.user,
            wallet=self.wallet,
            type=Transaction.Type.INCOME,
            amount=Decimal("200.00"),
        )
        self.assertEqual(tx.signed_amount, Decimal("200.00"))

    def test_signed_amount_expense(self):
        tx = Transaction.objects.create(
            user=self.user,
            wallet=self.wallet,
            type=Transaction.Type.EXPENSE,
            amount=Decimal("50.00"),
        )
        self.assertEqual(tx.signed_amount, Decimal("-50.00"))
