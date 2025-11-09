from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet,
    WalletViewSet,
    TransactionViewSet,
    AIPlanViewSet,
    AIPlanGenerateView
)

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"wallets", WalletViewSet, basename="wallet")
router.register(r"transactions", TransactionViewSet, basename="transaction")
router.register(r"ai/plans", AIPlanViewSet, basename="ai-plan")

urlpatterns = [
    path("", include(router.urls)),
    path("ai/plan/generate/", AIPlanGenerateView.as_view(), name="ai-plan-generate"),
]

app_name = "finance"