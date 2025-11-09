import json
import re
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.cache import cache
from finance.llm.client import get_groq_client, get_groq_model
from finance.llm.prompts import build_messages
from finance.services.llm_context import build_user_finance_context
from finance.utils.prompt_validator import validate_and_classify_prompt

def _extract_json(content: str):
    if not content:
        return None

    s = content.strip()
    if s.startswith("```"):
        s = re.sub(r"^```[a-zA-Z0-9_-]*\s*", "", s)
        s = s.replace("```", "").strip()

    start = s.find("{")
    end = s.rfind("}")
    if start == -1 or end == -1:
        return None

    candidate = s[start:end + 1]

    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        pass

    candidate = re.sub(r",(\s*[}\]])", r"\1", candidate)

    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        pass

    try:
        in_string = False
        escape = False

        for char in candidate:
            if escape:
                escape = False
                continue
            if char == '\\':
                escape = True
                continue
            if char == '"':
                in_string = not in_string

        if in_string:
            candidate += '"'

        candidate = re.sub(r'[,:](\s*)$', r'\1', candidate)

        open_brackets = candidate.count("[") - candidate.count("]")
        open_braces = candidate.count("{") - candidate.count("}")

        if open_brackets > 0:
            candidate += "]" * open_brackets
        if open_braces > 0:
            candidate += "}" * open_braces

        return json.loads(candidate)
    except Exception:
        return None


class AIPlanGenerateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        body = request.data or {}

        cache_key = f"ai_plan_rate:{user.id}"
        attempts = cache.get(cache_key, 0)

        if attempts >= 5:
            return Response({
                "detail": "Limite de 5 gerações por hora excedido."
            }, status=429)

        template = (body.get("template") or "generico").strip().lower()
        objective = (body.get("objective") or "").strip()
        custom_prompt = (body.get("prompt") or "").strip()

        if template == "custom":
            if not custom_prompt:
                return Response({"detail": "Prompt obrigatório para template custom."}, status=400)

            result = validate_and_classify_prompt(custom_prompt)
            if not result["is_valid"]:
                return Response({"detail": "Prompt inválido", "errors": result["errors"]}, status=400)

            meta = {"intent": result["intent"], "lang": result["lang"], "warnings": result["warnings"]}
            objective_for_llm = objective or "Plano Personalizado"
        else:
            if not objective:
                return Response({"detail": "Campo 'objective' obrigatório."}, status=400)

            result = validate_and_classify_prompt(objective)
            if not result["is_valid"]:
                return Response({"detail": "Objetivo inválido", "errors": result["errors"]}, status=400)

            meta = {"intent": result["intent"], "lang": result["lang"], "warnings": result["warnings"]}
            objective_for_llm = objective

        try:
            context_dict = build_user_finance_context(user, top_categories=8)
        except Exception as e:
            return Response({"detail": f"Erro ao carregar contexto: {str(e)}"}, status=500)

        try:
            messages = build_messages(
                {**body, "objective": objective_for_llm},
                context_dict=context_dict,
                meta=meta
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)

        try:
            cache.set(cache_key, attempts + 1, timeout=3600)

            client = get_groq_client()
            model = get_groq_model()

            resp = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=body.get("temperature", 0.5),
                max_completion_tokens=4096,
                stream=False,
            )

            content = (resp.choices[0].message.content if resp.choices else "") or ""
            if not content:
                return Response({"detail": "Resposta vazia do modelo"}, status=500)

            data = _extract_json(content)

            if not data or not isinstance(data, dict):
                return Response({
                    "detail": "JSON inválido na resposta",
                    "preview": content[:200]
                }, status=422)

            if not data.get("title") or not data.get("spec"):
                return Response({
                    "detail": "Resposta incompleta: faltam 'title' ou 'spec'"
                }, status=422)

            return Response({
                "model": model,
                "data": data,
                "tokens_used": getattr(resp.usage, 'total_tokens', 0) if hasattr(resp, 'usage') else 0,
                "template": template,
                "objective": objective_for_llm
            }, status=200)

        except Exception as e:
            return Response({
                "detail": f"Erro ao gerar plano: {str(e)}",
                "error_type": type(e).__name__
            }, status=500)