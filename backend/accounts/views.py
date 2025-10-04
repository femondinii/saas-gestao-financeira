from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings

from .serializers import (
    RegisterSerializer,
    UserSerializer,
    EmailTokenObtainPairSerializer,
)

def cookie_kwargs():
    return {
        "httponly": True,
        "secure": not settings.DEBUG,
        "samesite": "Lax",
        "path": "/accounts/auth/",
        "max_age": 7 * 24 * 3600,
    }

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class LoginView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]
    def post(self, request, *args, **kwargs):
        resp = super().post(request, *args, **kwargs)
        refresh = resp.data.pop("refresh", None)
        if refresh:
            resp.set_cookie("refresh_token", refresh, **cookie_kwargs())
        return resp

class RefreshView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        token = request.COOKIES.get("refresh_token")
        if not token:
            return Response({"detail": "no refresh"}, status=status.HTTP_401_UNAUTHORIZED)
        rt = RefreshToken(token)
        access = str(rt.access_token)
        new_rt = str(RefreshToken.for_user(rt.user))
        resp = Response({"access": access})
        resp.set_cookie("refresh_token", new_rt, **cookie_kwargs())
        return resp

class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        resp = Response(status=status.HTTP_205_RESET_CONTENT)
        resp.delete_cookie("refresh_token", path="/accounts/auth/")
        return resp

class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user