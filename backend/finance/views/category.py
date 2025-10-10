from django.db.models import Q
from rest_framework import viewsets, permissions
from rest_framework.pagination import PageNumberPagination
from finance.models import Category
from finance.serializers import CategorySerializer

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