from django.test import TestCase
from django.contrib.auth import get_user_model
from finance.models.wallet import Wallet

User = get_user_model()

class WalletModelTests(TestCase):
    def test_create_wallet(self):
        user = User.objects.create_user(email="u@example.com", password="123", name="User")
        wallet = Wallet.objects.create(user=user, name="Main Wallet")

        self.assertIsNotNone(wallet.id)
        self.assertEqual(wallet.user, user)
        self.assertEqual(wallet.name, "Main Wallet")
