from rest_framework import serializers
from finance.models import AIPlan

class AIPlanSerializer(serializers.ModelSerializer):
	class Meta:
		model = AIPlan
		fields = [
			"id",
			"title",
			"template",
			"objective",
			"spec",
			"model",
			"temperature",
			"tokens",
			"created_at",
			"updated_at",
		]
		read_only_fields = ["id", "created_at", "updated_at"]

	def create(self, validated_data):
		validated_data["user"] = self.context["request"].user
		return super().create(validated_data)
