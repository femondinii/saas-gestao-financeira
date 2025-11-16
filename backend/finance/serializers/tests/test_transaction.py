from decimal import Decimal
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from rest_framework import serializers

from finance.models.wallet import Wallet
from finance.models.transaction import Transaction
from finance.models.category import Category
from finance.serializers.transaction import TransactionSerializer

User = get_user_model()

class TransactionSerializerTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.u1 = User.objects.create_user(email="u1@example.com", password="123", name="U1")
        self.u2 = User.objects.create_user(email="u2@example.com", password="123", name="U2")
        self.req_u1 = self.factory.post("/fake/")
        self.req_u1.user = self.u1
        self.w1 = Wallet.objects.create(user=self.u1, name="Main")
        self.w2 = Wallet.objects.create(user=self.u2, name="Other")
        self.cat = Category.objects.create(user=self.u1, name="Food")

    def test_create_sets_user_and_is_valid(self):
        data = {
            "type": Transaction.Type.INCOME,
            "wallet": self.w1.id,
            "category": self.cat.id,
            "amount": Decimal("10.00"),
            "description": "salary",
        }
        ser = TransactionSerializer(data=data, context={"request": self.req_u1})
        self.assertTrue(ser.is_valid(), ser.errors)
        obj = ser.save()
        self.assertIsInstance(obj, Transaction)
        self.assertEqual(obj.user, self.u1)
        self.assertEqual(obj.wallet, self.w1)
        self.assertEqual(obj.category, self.cat)
        self.assertEqual(obj.amount, Decimal("10.00"))

        ser_out = TransactionSerializer(instance=obj, context={"request": self.req_u1})
        payload = ser_out.data
        self.assertIn("wallet_detail", payload)
        self.assertIn("category_detail", payload)

    def test_amount_must_be_positive(self):
        for bad in [Decimal("0.00"), Decimal("-1.00")]:
            data = {
                "type": Transaction.Type.EXPENSE,
                "wallet": self.w1.id,
                "amount": bad,
            }
            ser = TransactionSerializer(data=data, context={"request": self.req_u1})
            self.assertFalse(ser.is_valid())
            self.assertIn("amount", ser.errors)

    def test_wallet_is_required(self):
        data = {
            "type": Transaction.Type.EXPENSE,
            "amount": Decimal("5.00"),
        }
        ser = TransactionSerializer(data=data, context={"request": self.req_u1})
        self.assertFalse(ser.is_valid())
        self.assertIn("wallet", ser.errors)

    def test_wallet_must_belong_to_request_user(self):
        data = {
            "type": Transaction.Type.EXPENSE,
            "wallet": self.w2.id,
            "amount": Decimal("5.00"),
        }
        ser = TransactionSerializer(data=data, context={"request": self.req_u1})
        self.assertFalse(ser.is_valid())
        self.assertIn("wallet", ser.errors)

    def test_validate_amount_non_positive_hits_custom_raise(self):
        ser = TransactionSerializer(context={"request": self.req_u1})
        with self.assertRaises(serializers.ValidationError) as exc:
            ser.validate({"amount": Decimal("0.00"), "wallet": self.w1})
        self.assertIn("amount", exc.exception.detail)

    def test_validate_wallet_required_hits_custom_raise(self):
        ser = TransactionSerializer(context={"request": self.req_u1})
        with self.assertRaises(serializers.ValidationError) as exc:
            ser.validate({"amount": Decimal("10.00")})  # sem wallet
        self.assertIn("wallet", exc.exception.detail)

    def test_validate_wallet_not_owned_by_user_hits_custom_raise(self):
        ser = TransactionSerializer(context={"request": self.req_u1})
        with self.assertRaises(serializers.ValidationError) as exc:
            ser.validate({"amount": Decimal("10.00"), "wallet": self.w2})
        self.assertIn("wallet", exc.exception.detail)
