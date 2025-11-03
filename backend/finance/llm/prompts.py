import json

PLAN_SCHEMA_HINT = """
Responda SOMENTE em JSON válido, seguindo este schema:
{
  "title": string,
  "spec": {
    "overview": { "objective": string, "summary": string },
    "strategy": { "title": string, "text": string, "steps": string[] },
    "goals": {
      "items": [
        { "title": string, "description": string, "target": number|null, "current": number|null, "deadline": string, "category": string }
      ],
      "suggested": [
        { "title": string, "description": string, "target": number|null, "deadline": string, "category": string }
      ]
    },
    "risks": [
      { "title": string, "severity": "Alto"|"Médio"|"Baixo", "description": string, "mitigation": string }
    ]
  }
}
"""

def build_messages(payload: dict, *, context_dict: dict | None = None, meta: dict | None = None):
    objective = payload.get("objective") or "Criar um planejamento financeiro pessoal."
    persona = payload.get("persona") or "Perfil moderado, respostas em pt-BR."
    template = payload.get("template") or "generico"
    user_custom_prompt = payload.get("prompt") or ""

    sys = (
        "Você é um planejador financeiro especializado em finanças pessoais brasileiras. "
        "Responda sempre em português do Brasil. "
        "Você deve seguir o seguinte contexto financeiro: {ContextoFinanceiroJSON} "
        "Detalhe bem o planejamento financeiro, incluindo objetivos, estratégias, riscos e recomendações. "
        "Use análise preditiva para sugerir metas financeiras realistas e apontar riscos potenciais. "
        "Você APENAS responde sobre planejamento financeiro, orçamento, metas, dívidas e investimentos. "
        "Se for solicitado algo fora desse escopo, responda: 'Só posso ajudar com planejamento financeiro.' "
        "Retorne SOMENTE JSON conforme o schema indicado, sem comentários fora do JSON."
    )

    intent = (meta or {}).get("intent") or "general_finance"
    lang = (meta or {}).get("lang") or "pt"
    warnings = (meta or {}).get("warnings") or []

    hints = {
        "intent": intent,
        "lang": lang,
        "notes": warnings[:3]
    }

    user_text = (
        f"Objetivo: {objective}\n"
        f"Template: {template}\n"
        f"Persona: {persona}\n"
    )
    if user_custom_prompt:
        user_text += f"PromptDoUsuário: {user_custom_prompt}\n"

    if context_dict:
        user_text += "ContextoFinanceiroJSON:\n"
        user_text += json.dumps(context_dict, ensure_ascii=False, separators=(",", ":"))
        user_text += "\n\n"

    user_text += "Orientações:\n"
    user_text += json.dumps(hints, ensure_ascii=False, separators=(",", ":"))
    user_text += "\n\n"
    user_text += PLAN_SCHEMA_HINT

    return [
        {"role": "system", "content": sys},
        {"role": "user", "content": user_text},
    ]
