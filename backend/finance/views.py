from datetime import date
from calendar import monthrange
from decimal import Decimal
from django.db.models import Q, Sum, Case, When, F, DecimalField
from django.db.models.functions import TruncMonth
from rest_framework import viewsets, permissions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Category, Transaction
from .serializers import CategorySerializer, TransactionSerializer

class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return getattr(obj, "user_id", None) == request.user.id

class DefaultPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 200

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    pagination_class = DefaultPagination

    def get_queryset(self):
        u = self.request.user
        return Category.objects.filter(Q(user=u) | Q(user__isnull=True)).order_by("name")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    pagination_class = DefaultPagination

    def get_queryset(self):
        qs = Transaction.objects.filter(user=self.request.user)
        params = self.request.query_params
        date_start = params.get("date_start")
        date_end = params.get("date_end")

        if date_start:
            qs = qs.filter(date__gte=date_start)
        if date_end:
            qs = qs.filter(date__lte=date_end)
        tx_type = params.get("type")
        if tx_type in ("income", "expense"):
            qs = qs.filter(type=tx_type)
        status_param = params.get("status")
        if status_param in ("pending", "cleared", "canceled"):
            qs = qs.filter(status=status_param)
        category_id = params.get("category_id")
        if category_id:
            qs = qs.filter(category_id=category_id)
        is_archived = params.get("is_archived")
        if is_archived in ("true", "1"):
            qs = qs.filter(is_archived=True)
        elif is_archived in ("false", "0", None):
            qs = qs.filter(is_archived=False)
        q = params.get("q")
        if q:
            qs = qs.filter(Q(description__icontains=q) | Q(notes__icontains=q))
        ordering = params.get("ordering", "-date")
        allowed = {"date", "-date", "amount", "-amount", "created_at", "-created_at"}
        if ordering not in allowed:
            ordering = "-date"
        qs = qs.order_by(ordering, "-id")
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["delete"], url_path="bulk")
    def bulk_delete(self, request):
        raw = request.query_params.getlist("id")
        if not raw and isinstance(request.data, dict):
            raw = request.data.get("ids", [])
        try:
            ids = [int(x) for x in raw]
        except (TypeError, ValueError):
            return Response({"detail": "ids inválidos"}, status=status.HTTP_400_BAD_REQUEST)
        if not ids:
            return Response({"detail": "informe id"}, status=status.HTTP_400_BAD_REQUEST)
        qs = Transaction.objects.filter(user=request.user, id__in=ids)
        deleted = qs.count()
        qs.delete()
        return Response({"deleted": deleted}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        def month_bounds(y, m):
            return date(y, m, 1), date(y, m, monthrange(y, m)[1])

        def sum_signed(qs):
            return qs.aggregate(
                total=Sum(
                    Case(
                        When(type="income", then=F("amount")),
                        When(type="expense", then=-F("amount")),
                        output_field=DecimalField(max_digits=14, decimal_places=2),
                    )
                )
            )["total"] or Decimal("0.00")

        def sum_income(qs):
            return qs.filter(type="income").aggregate(s=Sum("amount"))["s"] or Decimal("0.00")

        def sum_expense(qs):
            return qs.filter(type="expense").aggregate(s=Sum("amount"))["s"] or Decimal("0.00")

        def pct_change(curr, prev):
            if prev and prev != Decimal("0"):
                return float((curr - prev) / prev)
            return None

        qs_base = Transaction.objects.filter(user=request.user, is_archived=False)
        status_param = request.query_params.get("status", "cleared")
        if status_param in ("pending", "cleared", "canceled"):
            qs_base = qs_base.filter(status=status_param)

        today = date.today()
        start, end = month_bounds(today.year, today.month)
        prev_y, prev_m = (start.year, start.month - 1) if start.month > 1 else (start.year - 1, 12)
        pstart, pend = month_bounds(prev_y, prev_m)
        qs_period = qs_base.filter(date__gte=start, date__lte=end)
        qs_prev = qs_base.filter(date__gte=pstart, date__lte=pend)
        balance_total = sum_signed(qs_base.filter(status="cleared"))
        income_curr = sum_income(qs_period)
        expense_curr = sum_expense(qs_period)
        income_prev = sum_income(qs_prev)
        expense_prev = sum_expense(qs_prev)

        data = {
            "as_of": today.isoformat(),
            "period": {"start": start.isoformat(), "end": end.isoformat()},
            "balance": str(balance_total),
            "income": {
                "current": str(income_curr),
                "previous": str(income_prev),
                "change_pct": pct_change(income_curr, income_prev),
            },
            "expenses": {
                "current": str(expense_curr),
                "previous": str(expense_prev),
                "change_pct": pct_change(expense_curr, expense_prev),
            },
        }
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="monthly")
    def monthly(self, request):
        from django.utils import timezone
        months_param = request.query_params.get("months", "6")
        try:
            months = max(1, min(24, int(months_param)))
        except ValueError:
            months = 6
        status_param = request.query_params.get("status", "cleared")
        base_qs = Transaction.objects.filter(user=request.user, is_archived=False)
        if status_param in ("pending", "cleared", "canceled"):
            base_qs = base_qs.filter(status=status_param)
        today = timezone.localdate()
        start_month_year = today.year
        start_month = today.month - (months - 1)
        while start_month <= 0:
            start_month += 12
            start_month_year -= 1
        start = date(start_month_year, start_month, 1)
        end = date(today.year, today.month, monthrange(today.year, today.month)[1])
        grouped = (
            base_qs.filter(date__gte=start, date__lte=end)
            .annotate(period=TruncMonth("date"))
            .values("period")
            .annotate(
                income=Sum("amount", filter=Q(type="income")),
                expenses=Sum("amount", filter=Q(type="expense")),
            )
            .order_by("period")
        )
        by_period = {g["period"].strftime("%Y-%m"): g for g in grouped}
        labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
        out = []
        y = start.year
        m = start.month
        for _ in range(months):
            key = f"{y:04d}-{m:02d}"
            g = by_period.get(key)
            inc = g["income"] or Decimal("0.00") if g else Decimal("0.00")
            exp = g["expenses"] or Decimal("0.00") if g else Decimal("0.00")
            out.append(
                {
                    "year": y,
                    "month_num": m,
                    "month": labels[m - 1],
                    "income": str(inc),
                    "expenses": str(exp),
                }
            )
            m += 1
            if m > 12:
                m = 1
                y += 1
        return Response({"months": out}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="expenses-by-category")
    def expenses_by_category(self, request):
        status_param = request.query_params.get("status", "cleared")
        qs = Transaction.objects.filter(user=request.user, is_archived=False, type="expense")

        if status_param in ("pending", "cleared", "canceled"):
            qs = qs.filter(status=status_param)

        y = request.query_params.get("year")
        m = request.query_params.get("month")

        if y and m:
            y, m = int(y), int(m)
            start = date(y, m, 1)
            end = date(y, m, monthrange(y, m)[1])
            qs = qs.filter(date__gte=start, date__lte=end)
        else:
            today = date.today()
            start = date(today.year, today.month, 1)
            end = date(today.year, today.month, monthrange(today.year, today.month)[1])
            qs = qs.filter(date__gte=start, date__lte=end)

        agg = qs.values("category__name").annotate(total=Sum("amount")).order_by("-total")
        items = [{"name": (row["category__name"] or "Sem categoria"), "value": str(row["total"] or Decimal("0.00"))} for row in agg]
        return Response({"items": items, "period": {"start": start.isoformat(), "end": end.isoformat()}}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="balance-series")
    def balance_series(self, request):
        from django.utils import timezone
        months_param = request.query_params.get("months", "6")
        try:
            months = max(1, min(24, int(months_param)))
        except ValueError:
            months = 6
        status_param = request.query_params.get("status", "cleared")
        base_qs = Transaction.objects.filter(user=request.user, is_archived=False)
        if status_param in ("pending", "cleared", "canceled"):
            base_qs = base_qs.filter(status=status_param)
        today = timezone.localdate()
        start_month_year = today.year
        start_month = today.month - (months - 1)
        while start_month <= 0:
            start_month += 12
            start_month_year -= 1
        start = date(start_month_year, start_month, 1)
        end = date(today.year, today.month, monthrange(today.year, today.month)[1])
        prior = base_qs.filter(date__lt=start).aggregate(
            total=Sum(
                Case(
                    When(type="income", then=F("amount")),
                    When(type="expense", then=-F("amount")),
                    output_field=DecimalField(max_digits=14, decimal_places=2),
                )
            )
        )["total"] or Decimal("0.00")
        grouped = (
            base_qs.filter(date__gte=start, date__lte=end)
            .annotate(period=TruncMonth("date"))
            .values("period")
            .annotate(
                delta=Sum(
                    Case(
                        When(type="income", then=F("amount")),
                        When(type="expense", then=-F("amount")),
                        output_field=DecimalField(max_digits=14, decimal_places=2),
                    )
                )
            )
            .order_by("period")
        )
        by_period = {g["period"].strftime("%Y-%m"): g["delta"] or Decimal("0.00") for g in grouped}
        labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
        out = []
        running = prior
        y = start.year
        m = start.month
        for _ in range(months):
            key = f"{y:04d}-{m:02d}"
            running += by_period.get(key, Decimal("0.00"))
            out.append({"year": y, "month_num": m, "month": labels[m - 1], "balance": str(running)})
            m += 1
            if m > 12:
                m = 1
                y += 1
        return Response({"months": out, "opening_balance": str(prior)}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="income-by-source")
    def income_by_source(self, request):
        status_param = request.query_params.get("status", "cleared")
        qs = Transaction.objects.filter(user=request.user, is_archived=False, type="income")
        if status_param in ("pending", "cleared", "canceled"):
            qs = qs.filter(status=status_param)
        y = request.query_params.get("year")
        m = request.query_params.get("month")
        if y and m:
            y, m = int(y), int(m)
            start = date(y, m, 1)
            end = date(y, m, monthrange(y, m)[1])
        else:
            today = date.today()
            start = date(today.year, today.month, 1)
            end = date(today.year, today.month, monthrange(today.year, today.month)[1])
        qs = qs.filter(date__gte=start, date__lte=end)
        agg = qs.values("category__name").annotate(total=Sum("amount")).order_by("-total")
        total_sum = sum((row["total"] or Decimal("0")) for row in agg) or Decimal("0")
        items = []
        for row in agg:
            name = row["category__name"] or "Sem categoria"
            val = row["total"] or Decimal("0")
            pct = float((val / total_sum) if total_sum else 0) * 100
            items.append({"name": name, "value": str(val), "percent": round(pct)})
        return Response({"items": items, "period": {"start": start.isoformat(), "end": end.isoformat()}}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="recent")
    def recent(self, request):
        try:
            limit = int(request.query_params.get("limit", "10"))
        except ValueError:
            limit = 10

        limit = max(1, min(50, limit))
        status_param = request.query_params.get("status", "cleared")
        qs = Transaction.objects.filter(user=request.user, is_archived=False)

        if status_param in ("pending", "cleared", "canceled"):
            qs = qs.filter(status=status_param)

        qs = qs.order_by("-date", "-id")[:limit]
        ser = self.get_serializer(qs, many=True)

        return Response(ser.data, status=status.HTTP_200_OK)