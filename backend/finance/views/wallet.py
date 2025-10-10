from decimal import Decimal
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from finance.models import Wallet
from finance.serializers import WalletSerializer
from .category import IsOwner, DefaultPagination

class WalletViewSet(viewsets.ModelViewSet):
    serializer_class = WalletSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    pagination_class = DefaultPagination

    def get_queryset(self):
        qs = Wallet.objects.filter(user=self.request.user)
        is_archived = self.request.query_params.get("is_archived")

        if is_archived in ("true", "1"):
            qs = qs.filter(is_archived=True)
        elif is_archived in ("false", "0", None):
            qs = qs.filter(is_archived=False)
        return qs.order_by("name")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"], url_path="total-balance")
    def total_balance(self, request):
        wallets = self.get_queryset().filter(is_archived=False)
        serializer = self.get_serializer(wallets, many=True)

        total = sum(Decimal(w["current_balance"]) for w in serializer.data)

        return Response({
            "total_balance": str(total),
            "wallets": serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="archive")
    def archive(self, request, pk=None):
        wallet = self.get_object()
        if wallet.is_archived:
            return Response({"detail": "Carteira já está arquivada."}, status=status.HTTP_400_BAD_REQUEST)

        wallet.is_archived = True
        wallet.save()

        serializer = self.get_serializer(wallet)
        return Response(serializer.data, status=status.HTTP_200_OK)