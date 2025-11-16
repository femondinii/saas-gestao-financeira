from decimal import Decimal
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from rest_framework import serializers

from finance.models.wallet import Wallet
from finance.models.transaction import Transaction
from finance.serializers.wallet import WalletSerializer

User = get_user_model()

class WalletSerializerTests(TestCase):
    def setUp(self):
        self.rf = RequestFactory()
        self.user = User.objects.create_user(email="u@example.com", password="123", name="U")
        self.other = User.objects.create_user(email="o@example.com", password="123", name="O")
        self.req = self.rf.post("/fake/")
        self.req.user = self.user

    def _tx(self, wallet, typ, amt, archived=False):
        return Transaction.objects.create(
            user=wallet.user, wallet=wallet, type=typ, amount=Decimal(amt), is_archived=archived
        )

    def test_create_sets_user(self):
        data = {"name": "Main", "kind": Wallet.Kind.CHECKING, "initial_balance": "100.00", "color": "#000000"}
        ser = WalletSerializer(data=data, context={"request": self.req})
        self.assertTrue(ser.is_valid(), ser.errors)
        obj = ser.save()
        self.assertEqual(obj.user, self.user)
        self.assertEqual(obj.name, "Main")

    def test_current_balance_checking_ignores_archived(self):
        w = Wallet.objects.create(user=self.user, name="W1", kind=Wallet.Kind.CHECKING, initial_balance=Decimal("100.00"))
        self._tx(w, Transaction.Type.INCOME,  "50.00")
        self._tx(w, Transaction.Type.EXPENSE, "20.00")
        self._tx(w, Transaction.Type.INCOME,  "999.00", archived=True)
        ser = WalletSerializer(instance=w, context={"request": self.req})
        self.assertEqual(ser.data["current_balance"], "130.00")

    def test_current_balance_credit_formula(self):
        w = Wallet.objects.create(user=self.user, name="Card", kind=Wallet.Kind.CREDIT, initial_balance=Decimal("200.00"))
        self._tx(w, Transaction.Type.EXPENSE, "50.00")
        self._tx(w, Transaction.Type.EXPENSE, "30.00")
        self._tx(w, Transaction.Type.INCOME,  "10.00")
        ser = WalletSerializer(instance=w, context={"request": self.req})
        self.assertEqual(ser.data["current_balance"], "-270.00")

    def test_validate_name_empty_after_strip(self):
        ser = WalletSerializer(
            data={"name": "   ", "kind": Wallet.Kind.CHECKING, "initial_balance": "0.00"},
            context={"request": self.req},
        )
        self.assertFalse(ser.is_valid())
        self.assertIn("name", ser.errors)

    def test_validate_name_blocks_duplicate_case_insensitive_active(self):
        Wallet.objects.create(user=self.user, name="Poupanca", kind=Wallet.Kind.SAVINGS)
        ser = WalletSerializer(
            data={"name": "poupanca", "kind": Wallet.Kind.SAVINGS, "initial_balance": "0.00"},
            context={"request": self.req},
        )
        self.assertFalse(ser.is_valid())
        self.assertIn("name", ser.errors)

    def test_validate_name_allows_duplicate_if_archived(self):
        Wallet.objects.create(user=self.user, name="Carteira X", kind=Wallet.Kind.CASH, is_archived=True)
        ser = WalletSerializer(
            data={"name": "carteira x", "kind": Wallet.Kind.CASH, "initial_balance": "0.00"},
            context={"request": self.req},
        )
        self.assertTrue(ser.is_valid(), ser.errors)

    def test_validate_name_excludes_self_on_update(self):
        w = Wallet.objects.create(user=self.user, name="Main", kind=Wallet.Kind.CHECKING)
        ser = WalletSerializer(
            instance=w,
            data={"name": "Main", "kind": w.kind, "initial_balance": "0.00"},
            context={"request": self.req},
        )
        self.assertTrue(ser.is_valid(), ser.errors)

    def test_validate_name_only_user_wallets_conflict(self):
        Wallet.objects.create(user=self.other, name="Uni", kind=Wallet.Kind.CHECKING)
        ser = WalletSerializer(
            data={"name": "uni", "kind": Wallet.Kind.CHECKING, "initial_balance": "0.00"},
            context={"request": self.req},
        )
        self.assertTrue(ser.is_valid(), ser.errors)

    def test_validate_name_spaces_hits_custom_raise(self):
        ser = WalletSerializer(context={"request": self.req})
        with self.assertRaises(serializers.ValidationError) as exc:
            ser.validate_name("   ")
        self.assertIn("Informe um nome", str(exc.exception))
