from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from decimal import Decimal

User = settings.AUTH_USER_MODEL

class Category(models.Model):
    class Kind(models.TextChoices):
        EXPENSE = "expense", "Despesa"
        INCOME  = "income",  "Receita"
        BOTH    = "both",    "Ambas"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="categories")
    name = models.CharField(max_length=60)
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.BOTH)
    is_system = models.BooleanField(default=False)

    class Meta:
        unique_together = ("user", "name")
        indexes = [models.Index(fields=["user","name"]), models.Index(fields=["user","kind"])]
        ordering = ["name"]

    def __str__(self): return f"{self.name} ({self.user})"

class Transaction(models.Model):
    class Type(models.TextChoices):
        EXPENSE = "expense", "Despesa"
        INCOME  = "income",  "Receita"
    class Status(models.TextChoices):
        PENDING="pending","Pendente"; CLEARED="cleared","Confirmada"; CANCELED="canceled","Cancelada"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="transactions")
    type = models.CharField(max_length=10, choices=Type.choices)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, related_name="transactions")
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    date = models.DateField(default=timezone.localdate)
    description = models.CharField(max_length=140, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.CLEARED)
    created_at = models.DateTimeField(auto_now_add=True); updated_at = models.DateTimeField(auto_now=True)
    is_archived = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["user","date"]),
            models.Index(fields=["user","type","date"]),
            models.Index(fields=["user","status"]),
            models.Index(fields=["user","category"]),
        ]
        ordering = ["-date","-created_at"]

    def __str__(self):
        sign = "-" if self.type==self.Type.EXPENSE else "+"
        return f"{self.user} {sign}R${self.amount} em {self.date}"

    @property
    def signed_amount(self):
        return self.amount if self.type==self.Type.INCOME else -self.amount
