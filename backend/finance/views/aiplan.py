from rest_framework import viewsets, permissions, filters
from rest_framework.pagination import PageNumberPagination
from finance.models import AIPlan
from finance.serializers import AIPlanSerializer

class IsOwner(permissions.BasePermission):
	def has_object_permission(self, request, view, obj):
		return getattr(obj, "user_id", None) == request.user.id

class DefaultPagination(PageNumberPagination):
	page_size = 20
	page_size_query_param = "page_size"
	max_page_size = 200

class AIPlanViewSet(viewsets.ModelViewSet):
	serializer_class = AIPlanSerializer
	permission_classes = [permissions.IsAuthenticated, IsOwner]
	pagination_class = DefaultPagination
	filter_backends = [filters.SearchFilter, filters.OrderingFilter]
	search_fields = ["title", "objective", "template"]
	ordering_fields = ["created_at", "updated_at"]
	ordering = ["-created_at"]

	def get_queryset(self):
		return AIPlan.objects.filter(user=self.request.user)

	def perform_create(self, serializer):
		serializer.save(user=self.request.user)
