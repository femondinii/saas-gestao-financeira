from rest_framework import serializers
from django.db.models import Q
from finance.models import Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "is_system", "is_archived"]
        read_only_fields = ["id", "is_system", "is_archived"]

    def validate_name(self, value):
        user = self.context["request"].user
        qs = Category.objects.filter(
            Q(user=user) | Q(user__isnull=True),
            name__iexact=value.strip(),
            is_archived=False,
        )

        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Já existe uma categoria com esse nome.")

        return value.strip()

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)