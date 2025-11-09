from django.urls import path
from .views import GoogleLoginView, GoogleCallbackView, RefreshView, LogoutView, MeView

urlpatterns = [
    path("auth/google/", GoogleLoginView.as_view(), name="auth-google"),
    path("auth/google/callback/", GoogleCallbackView.as_view(), name="auth-google-callback"),
    path("auth/refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
]