import json
import re
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from finance.llm.client import get_groq_client, get_groq_model
from finance.llm.prompts import build_messages
from finance.services.llm_context import build_user_finance_context
from finance.serializers import AIPlanSerializer
from finance.utils.prompt_validator import validate_and_classify_prompt, sanitize_prompt

def _coerce_json_from_llm(content: str):
    if not content:
        return None
    s = content.strip()
    if s.startswith("```"):
        s = re.sub(r"^```[a-zA-Z0-9_-]*\s*", "", s)
        if s.endswith("```"):
            s = s[:-3].rstrip()
    start = s.find("{")
    end = s.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    candidate = s[start:end + 1]
    try:
        return json.loads(candidate)
    except Exception:
        candidate_fix = re.sub(r",(\s*[}\]])", r"\1", candidate)
        try:
            return json.loads(candidate_fix)
        except Exception:
            return None

class AIPlanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        body = request.data or {}

        key = f"ai_plan_rate:{user.id}"
        att = cache.get(key, 0)
        if att >= 5:
            return Response({"detail": "Limite de solicitações excedido. Tente novamente em 1 hora."}, status=429)

        template = (body.get("template") or "generico").strip().lower()
        objective = (body.get("objective") or "").strip()
        custom_prompt = (body.get("prompt") or "").strip()
        save = str(body.get("save", "false")).lower() in ("1", "true", "yes")
        with_ctx = str(body.get("with_context", "true")).lower() in ("1", "true", "yes")

        if template == "custom":
            result = validate_and_classify_prompt(custom_prompt)
            if not result["is_valid"]:
                return Response({"detail": "Prompt inválido", "errors": result["errors"]}, status=400)
            body["prompt"] = result["normalized"]

            if objective:
                o2 = validate_and_classify_prompt(objective)
                if o2["is_valid"]:
                    body["objective"] = o2["normalized"]
            meta = {"intent": result["intent"], "lang": result["lang"], "warnings": result["warnings"]}
            objective_for_llm = body.get("objective") or "Plano Personalizado"
        else:
            if not objective:
                return Response({"detail": "O campo 'objective' é obrigatório para templates."}, status=400)
            o = validate_and_classify_prompt(objective)
            if not o["is_valid"]:
                return Response({"detail": "Objetivo inválido", "errors": o["errors"]}, status=400)
            body["objective"] = o["normalized"]
            meta = {"intent": o["intent"], "lang": o["lang"], "warnings": o["warnings"]}
            objective_for_llm = body["objective"]

        model = body.get("model") or get_groq_model()

        context_dict = None
        if with_ctx:
            context_dict = build_user_finance_context(user, top_categories=int(body.get("top_categories", 8)))

        try:
            messages = build_messages(
                {**body, "objective": objective_for_llm},
                context_dict=context_dict,
                meta=meta
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)

        client = get_groq_client()
        try:
            cache.set(key, att + 1, timeout=3600)

            resp = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=body.get("temperature", 0.5),
                top_p=body.get("top_p", 1),
                max_completion_tokens=body.get("max_tokens", 1500),
                stream=False,
            )

            content = (resp.choices[0].message.content if resp.choices else "") or ""
            data = None

            if content.strip().startswith("{"):
                try:
                    data = json.loads(content)
                except Exception:
                    data = None
            if data is None:
                data = _coerce_json_from_llm(content)
            if data is None:
                data = {"raw": content}

            title = data.get("title") if isinstance(data, dict) else None
            spec = data.get("spec") if isinstance(data, dict) else None

            if save:
                payload = {
                    "title": title or objective_for_llm or "Plano Financeiro",
                    "template": template or "generico",
                    "objective": body.get("objective") or custom_prompt or "",
                    "spec": spec or {},
                    "model": model,
                    "temperature": float(body.get("temperature", 0.4)),
                    "tokens": 0,
                }
                ser = AIPlanSerializer(data=payload, context={"request": request})
                ser.is_valid(raise_exception=True)
                obj = ser.save()
                return Response({"model": model, "data": ser.data, "saved": True, "context_used": bool(context_dict)}, status=200)

            return Response({"model": model, "data": data, "saved": False, "context_used": bool(context_dict)}, status=200)

        except Exception as e:
            return Response({"detail": str(e)}, status=400)
