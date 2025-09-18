from django.db.models import Q
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
