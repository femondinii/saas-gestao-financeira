from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, WalletViewSet, TransactionViewSet

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"wallets", WalletViewSet, basename="wallet")
router.register(r"transactions", TransactionViewSet, basename="transaction")

urlpatterns = router.urls
app_name = "finance"