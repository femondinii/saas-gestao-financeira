from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Mensagem

class MensagemView(APIView):
    def get(self, request):
        mensagens = Mensagem.objects.all().values('id', 'texto')
        return Response(list(mensagens))
