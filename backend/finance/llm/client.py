from groq import Groq
from django.conf import settings

def get_groq_client():
	api_key = getattr(settings, "GROQ_API_KEY", "") or ""
	return Groq(api_key=api_key)

def get_groq_model():
	return getattr(settings, "GROQ_MODEL", "llama-3.3-70b-versatile")