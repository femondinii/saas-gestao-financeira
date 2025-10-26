from django.conf import settings
from django.db import models
from django.db.models import Q
from django.db.models.functions import Lower

User = settings.AUTH_USER_MODEL

class Category(models.Model):
	user = models.ForeignKey(
		User, null=True, blank=True,
		on_delete=models.CASCADE, related_name="categories"
	)
	name = models.CharField(max_length=60)
	is_system = models.BooleanField(default=False)
	is_archived = models.BooleanField(default=False)

	class Meta:
		constraints = [
			models.UniqueConstraint(
				Lower("name"), "user",
				condition=Q(is_archived=False),
				name="uniq_user_category_name_insensitive",
			),
			models.UniqueConstraint(
				Lower("name"),
				condition=Q(user__isnull=True, is_archived=False),
				name="uniq_global_category_name_insensitive",
			),
		]
		indexes = [
			models.Index(Lower("name"), name="idx_category_name_lower"),
			models.Index(fields=["user", "name"]),
			models.Index(fields=["user", "is_archived"]),
		]
		ordering = ["name"]

	def __str__(self):
		who = "global" if self.user_id is None else self.user
		return f"{self.name} ({who})"
