from rest_framework import serializers
from finance.models import Transaction
from .category import CategorySerializer
from .wallet import WalletSerializer

class TransactionSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source="category", read_only=True)
    wallet_detail = WalletSerializer(source="wallet", read_only=True)

    class Meta:
        model = Transaction
        fields = [
            "id", "type", "wallet", "wallet_detail", "category", "category_detail",
            "amount", "date", "description", "created_at", "updated_at", "is_archived",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        amount = attrs.get("amount")

        if amount is not None and amount <= 0:
            raise serializers.ValidationError({"amount": "O valor deve ser positivo"})

        wallet = attrs.get("wallet")

        if not wallet:
            raise serializers.ValidationError({"wallet": "Carteira é obrigatória"})

        if wallet.user != self.context["request"].user:
            raise serializers.ValidationError({"wallet": "Carteira não pertence ao usuário"})

        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)