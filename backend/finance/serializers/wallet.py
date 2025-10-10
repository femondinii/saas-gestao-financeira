from decimal import Decimal
from rest_framework import serializers
from django.db.models import Sum, Case, When, F, DecimalField, Value
from finance.models import Wallet

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