from rest_framework import serializers
from .models import Category, Wallet, Transaction
from django.db.models import Q, Sum, Case, When, F, DecimalField, Value
from decimal import Decimal

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "is_system"]
        read_only_fields = ["id", "is_system"]

    def validate_name(self, value):
        user = self.context["request"].user
        qs = Category.objects.filter(
            Q(user=user) | Q(user__isnull=True),
            name__iexact=value.strip(),
        )
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Já existe uma categoria com esse nome.")
        return value

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class WalletSerializer(serializers.ModelSerializer):
    current_balance = serializers.SerializerMethodField()

    class Meta:
        model = Wallet
        fields = [
            "id", "name", "kind", "initial_balance", "current_balance",
            "color", "is_archived", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "current_balance", "created_at", "updated_at"]

    def get_current_balance(self, obj):
        total_transactions = obj.transactions.filter(is_archived=False).aggregate(
            total=Sum(
                Case(
                    When(type="income", then=F("amount")),
                    When(type="expense", then=-F("amount")),
                    default=Value(0),
                    output_field=DecimalField(max_digits=14, decimal_places=2),
                )
            )
        )["total"] or Decimal("0.00")

        # Não-crédito: current = initial + S
        # Crédito:     current = S - initial  (mostra como negativo quando há dívida)
        if obj.kind == Wallet.Kind.CREDIT:
            return str(total_transactions - obj.initial_balance)
        return str(obj.initial_balance + total_transactions)

    def validate_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError("Informe um nome.")

        user = self.context["request"].user
        qs = Wallet.objects.filter(
            user=user,
            is_archived=False,
            name__iexact=name,
        )
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError("Já existe uma carteira com esse nome.")
        return name

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

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