from django.urls import path
from .views import MensagemView

urlpatterns = [
    path('mensagem/', MensagemView.as_view()),
]