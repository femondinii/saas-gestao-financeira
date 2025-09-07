from rest_framework import serializers
from .models import Category, Transaction

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "kind", "is_system"]
        read_only_fields = ["id", "is_system"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class TransactionSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source="category", read_only=True)

    class Meta:
        model = Transaction
        fields = [
            "id", "type", "category", "category_detail", "amount", "date",
            "description", "notes", "status", "created_at", "updated_at",
            "is_archived",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        amount = attrs.get("amount")

        if amount is not None and amount <= 0:
            raise serializers.ValidationError({"amount": "O valor deve ser positivo."})

        category = attrs.get("category") or getattr(self.instance, "category", None)
        tx_type = attrs.get("type") or getattr(self.instance, "type", None)

        if category and tx_type and category.kind != Category.Kind.BOTH and category.kind != tx_type:
            raise serializers.ValidationError({"category": "Categoria incompatível com o tipo da transação."})

        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
