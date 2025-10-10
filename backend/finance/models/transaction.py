from django.conf import settings
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from decimal import Decimal

User = settings.AUTH_USER_MODEL

class Transaction(models.Model):
	class Type(models.TextChoices):
		EXPENSE = "expense", "Despesa"
		INCOME  = "income",  "Receita"

	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="transactions")
	wallet = models.ForeignKey("finance.Wallet", on_delete=models.CASCADE, related_name="transactions")
	type = models.CharField(max_length=10, choices=Type.choices)
	category = models.ForeignKey("finance.Category", null=True, blank=True, on_delete=models.SET_NULL, related_name="transactions")
	amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
	date = models.DateField(default=timezone.localdate)
	description = models.CharField(max_length=140, blank=True, default="")
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
	is_archived = models.BooleanField(default=False)

	class Meta:
		indexes = [
			models.Index(fields=["user", "date"]),
			models.Index(fields=["user", "type", "date"]),
			models.Index(fields=["user", "category"]),
			models.Index(fields=["wallet", "date"]),
		]
		ordering = ["-date", "-created_at"]

	def __str__(self):
		sign = "-" if self.type == self.Type.EXPENSE else "+"
		return f"{self.user} {sign}R${self.amount} em {self.date}"

	@property
	def signed_amount(self):
		return self.amount if self.type == self.Type.INCOME else -self.amount
