from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL

class AIPlan(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ai_plans")
	title = models.CharField(max_length=200)
	template = models.CharField(max_length=60, blank=True, default="")
	objective = models.CharField(max_length=300, blank=True, default="")
	spec = models.JSONField(default=dict, blank=True)
	model = models.CharField(max_length=60, blank=True, default="")
	temperature = models.FloatField(default=0.4)
	tokens = models.IntegerField(default=0)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		indexes = [
			models.Index(fields=["user", "-created_at"]),
		]
		ordering = ["-created_at"]
