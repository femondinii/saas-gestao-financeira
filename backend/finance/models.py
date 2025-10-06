from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q
from django.db.models.functions import Lower
from django.utils import timezone
from decimal import Decimal

User = settings.AUTH_USER_MODEL

class Category(models.Model):
    user = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.CASCADE, related_name="categories"
    )
    name = models.CharField(max_length=60)
    is_system = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                Lower("name"), "user",
                name="uniq_user_category_name_insensitive",
            ),
            models.UniqueConstraint(
                Lower("name"),
                condition=Q(user__isnull=True),
                name="uniq_global_category_name_insensitive",
            ),
        ]
        indexes = [
            models.Index(Lower("name"), name="idx_category_name_lower"),
            models.Index(fields=["user", "name"]),
        ]
        ordering = ["name"]

    def __str__(self):
        who = "global" if self.user_id is None else self.user
        return f"{self.name} ({who})"

class Wallet(models.Model):
    class Kind(models.TextChoices):
        CHECKING = "checking", "Conta corrente"
        SAVINGS  = "savings",  "Poupança"
        CASH     = "cash",     "Dinheiro"
        CREDIT   = "credit",   "Cartão de crédito"
        INVESTMENT = "investment", "Investimento"
        OTHER    = "other",    "Outros"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="wallets")
    name = models.CharField(max_length=60)
    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.CHECKING)
    initial_balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    color = models.CharField(max_length=7, default="#3B82F6")
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                Lower("name"), "user",
                condition=Q(is_archived=False),
                name="uniq_active_wallet_name_per_user_insensitive",
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.user})"


class Transaction(models.Model):
    class Type(models.TextChoices):
        EXPENSE = "expense", "Despesa"
        INCOME  = "income",  "Receita"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="transactions")
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name="transactions")
    type = models.CharField(max_length=10, choices=Type.choices)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, related_name="transactions")
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