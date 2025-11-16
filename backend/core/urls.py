from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    # Rotas JWT
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Rotas da app accounts
    path("api/accounts/", include("accounts.urls")),

    # Rotas da app finance
    path("api/finance/", include("finance.urls")),

    # Rotas de métricas Prometheus
    path("metrics/", include("django_prometheus.urls")),
]