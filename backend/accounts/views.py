from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.conf import settings
from .serializers import UserSerializer
import requests

User = get_user_model()

class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        google_auth_url = (
            "https://accounts.google.com/o/oauth2/v2/auth"
            f"?client_id={settings.GOOGLE_OAUTH_CLIENT_ID}"
            f"&redirect_uri={settings.GOOGLE_OAUTH_REDIRECT_URI}"
            "&response_type=code"
            "&scope=openid%20email%20profile"
            "&access_type=offline"
            "&prompt=consent"
        )
        return Response({"auth_url": google_auth_url})

class GoogleCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        code = request.data.get("code")
        if not code:
            return Response({"error": "Código não fornecido"}, status=400)

        try:
            token_res = requests.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
                    "client_secret": settings.GOOGLE_OAUTH_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_OAUTH_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
                timeout=10
            )
            token_data = token_res.json()
            if "error" in token_data:
                return Response(token_data, status=400)

            userinfo_res = requests.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
                timeout=10
            )
            userinfo = userinfo_res.json()
            email = userinfo.get("email")
            name = userinfo.get("name", email.split("@")[0])

            if not email:
                return Response({"error": "Email não retornado"}, status=400)

            user, _ = User.objects.get_or_create(email=email, defaults={"name": name})

            refresh = RefreshToken.for_user(user)
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {"id": user.id, "email": user.email, "name": user.name}
            })

        except Exception as e:
            return Response({"error": str(e)}, status=500)

class RefreshView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        token = request.COOKIES.get("refresh_token")

        if not token:
            return Response(
                {"detail": "Nenhum refresh token fornecido"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            rt = RefreshToken(token)
            user = User.objects.get(id=rt['user_id'])
            new_refresh = RefreshToken.for_user(user)
            access = str(new_refresh.access_token)
            response = Response({"access": access})

            response.set_cookie(
                "refresh_token",
                str(new_refresh),
                httponly=True,
                secure=not settings.DEBUG,
                samesite="Lax",
                path="/",
                max_age=7 * 24 * 3600
            )

            return response

        except Exception as e:
            return Response(
                {"detail": "Refresh token inválido"},
                status=status.HTTP_401_UNAUTHORIZED
            )


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        response = Response(
            {"message": "Logout realizado com sucesso"},
            status=status.HTTP_200_OK
        )
        response.delete_cookie("refresh_token", path="/")
        return response


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user