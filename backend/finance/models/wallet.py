from django.conf import settings
from django.db import models
from django.db.models import Q
from django.db.models.functions import Lower
from decimal import Decimal

User = settings.AUTH_USER_MODEL

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

