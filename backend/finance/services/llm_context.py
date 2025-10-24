from datetime import date
from calendar import monthrange
from decimal import Decimal
from django.db.models import Q, Sum, Case, When, F, DecimalField
from django.utils import timezone
from finance.models import Wallet, Transaction, Category

TRANSFER_Q = Q(category__is_system=True, category__name__iexact="Transferência")

def _exclude_transfers(qs):
	return qs.exclude(TRANSFER_Q)

def _sum_signed(qs):
	return qs.aggregate(
		total=Sum(
			Case(
				When(type=Transaction.Type.INCOME, then=F("amount")),
				When(type=Transaction.Type.EXPENSE, then=-F("amount")),
				output_field=DecimalField(max_digits=14, decimal_places=2),
			)
		)
	)["total"] or Decimal("0.00")

def _month_bounds(d: date):
	return date(d.year, d.month, 1), date(d.year, d.month, monthrange(d.year, d.month)[1])

def _to_str(v):
	return str(v) if isinstance(v, Decimal) else v

def build_user_finance_context(user, *, top_categories=8, months_back=0):
	today = timezone.localdate()
	start, end = _month_bounds(today)

	wallets_qs = Wallet.objects.filter(user=user, is_archived=False)
	wallets = []
	for w in wallets_qs:
		tx_qs = _exclude_transfers(w.transactions.filter(is_archived=False))
		w_balance = _sum_signed(tx_qs)
		if w.kind == Wallet.Kind.CREDIT:
			pass
		current = (w.initial_balance or Decimal("0.00")) + (w_balance or Decimal("0.00"))
		wallets.append({
			"id": w.id,
			"name": w.name,
			"kind": w.kind,
			"color": w.color,
			"initial_balance": _to_str(w.initial_balance),
			"current_balance": _to_str(current),
		})

	base_qs = _exclude_transfers(Transaction.objects.filter(user=user, is_archived=False))
	period_qs = base_qs.filter(date__gte=start, date__lte=end)
	income_curr = period_qs.filter(type=Transaction.Type.INCOME).aggregate(s=Sum("amount"))["s"] or Decimal("0.00")
	expense_curr = period_qs.filter(type=Transaction.Type.EXPENSE).aggregate(s=Sum("amount"))["s"] or Decimal("0.00")

	net_worth = sum(Decimal(w["current_balance"]) for w in wallets) if wallets else Decimal("0.00")

	cat_qs = period_qs.filter(type=Transaction.Type.EXPENSE)
	cat_agg = (
		cat_qs.values("category__id", "category__name")
		.annotate(total=Sum("amount"))
		.order_by("-total")
	)
	categories = []
	for row in cat_agg[:top_categories]:
		categories.append({
			"id": row["category__id"] or None,
			"name": row["category__name"] or "Sem categoria",
			"total": _to_str(row["total"] or Decimal("0.00")),
		})

	all_cats_qs = Category.objects.filter(Q(user=user) | Q(user__isnull=True)).order_by("name")
	all_categories = [{"id": c.id, "name": c.name, "is_system": c.is_system} for c in all_cats_qs[:200]]

	ctx = {
		"period": {"start": start.isoformat(), "end": end.isoformat()},
		"totals": {
			"income_month": _to_str(income_curr),
			"expenses_month": _to_str(expense_curr),
			"net_worth": _to_str(net_worth),
		},
		"wallets": wallets,
		"top_expense_categories_month": categories,
		"categories": all_categories,
	}

	return ctx
