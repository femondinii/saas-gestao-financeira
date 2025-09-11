from rest_framework import serializers
from .models import Category, Transaction
from django.db.models import Q

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
        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
