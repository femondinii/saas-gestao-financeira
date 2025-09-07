from django.db.models import Q
from rest_framework import viewsets, permissions
from rest_framework.pagination import PageNumberPagination
from .models import Category, Transaction
from .serializers import CategorySerializer, TransactionSerializer

class IsOwner(permissions.BasePermission):
    """Garante que o objeto pertence ao usuário."""
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
        return Category.objects.filter(user=self.request.user).order_by("name")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    pagination_class = DefaultPagination

    def get_queryset(self):
        qs = Transaction.objects.filter(user=self.request.user)

        # ---- Filtros ----
        params = self.request.query_params

        # período
        date_start = params.get("date_start")
        date_end = params.get("date_end")
        if date_start:
            qs = qs.filter(date__gte=date_start)
        if date_end:
            qs = qs.filter(date__lte=date_end)

        # tipo (income|expense)
        tx_type = params.get("type")
        if tx_type in ("income", "expense"):
            qs = qs.filter(type=tx_type)

        # status (pending|cleared|canceled)
        status = params.get("status")
        if status in ("pending", "cleared", "canceled"):
            qs = qs.filter(status=status)

        # category_id
        category_id = params.get("category_id")
        if category_id:
            qs = qs.filter(category_id=category_id)

        # arquivadas
        is_archived = params.get("is_archived")
        if is_archived in ("true", "1"):
            qs = qs.filter(is_archived=True)
        elif is_archived in ("false", "0", None):
            qs = qs.filter(is_archived=False)

        # busca simples (description/notes)
        q = params.get("q")
        if q:
            qs = qs.filter(Q(description__icontains=q) | Q(notes__icontains=q))

        # ---- Ordenação ----
        # permitidos: date, -date, amount, -amount, created_at, -created_at
        ordering = params.get("ordering", "-date")
        allowed = {"date", "-date", "amount", "-amount", "created_at", "-created_at"}
        if ordering not in allowed:
            ordering = "-date"
        qs = qs.order_by(ordering, "-id")

        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
