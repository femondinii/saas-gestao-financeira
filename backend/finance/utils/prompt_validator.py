import re
from typing import Tuple, List, Dict
from .lang import detect_lang_code  # usa langdetect já instalado

MIN_LEN = 20
MAX_LEN = 2000

FINANCIAL_KWS = [
    # gerais
    'economizar','poupar','investir','dinheiro','reais','r$','renda','salário','salario',
    'despesa','receita','financeiro','financeira','orçamento','orcamento','meta','objetivo',
    'guardar','juntar','gastar','pagar','dívida','divida','conta','banco','cartão','cartao',
    'comprar','vender','lucro','prejuízo','prejuizo','saldo','valor','custo','preço','preco','taxa',
    # crédito / imóvel
    'financiar','financiamento','imóvel','imovel','apartamento','casa','entrada','sinal','hipoteca','parcela',
    # investimento
    'tesouro','cdb','selic','fundo','ações','acoes','rendimento','juros'
]

INJECTION_PATTERNS = [
    r'ignore\s+(previous|above|all|earlier)\s+instructions?',
    r'disregard\s+(previous|above|all)\s+instructions?',
    r'\bsystem\s*:',
    r'\byou\s+are\s+(now|a|an)\s+',
    r'forget\s+(everything|all|previous|what)',
    r'new\s+instructions?',
    r'<\s*script',
    r'javascript:',
    r'eval\s*\(',
    r'pretend\s+to\s+be',
    r'roleplay\s+as',
    r'act\s+as\s+(if|a|an)',
    r'override\s+',
    r'\bsudo\s+',
    r'\{\{.*?\}\}',
    r'\bexecute\s+',
    r'\brun\s+code',
]

INTENT_BUCKETS = {
    "home_purchase": ['financiar','financiamento','imóvel','imovel','apartamento','casa','entrada','sinal','hipoteca','parcela'],
    "debt_strategy": ['dívida','divida','cartão','cartao','juros','renegociar','parcelar'],
    "budgeting": ['orçamento','orcamento','gastos','despesa','categoria','controle'],
    "investing": ['investir','investimento','tesouro','cdb','ações','acoes','selic','fundo','rendimento'],
    "savings_goal": ['economizar','poupar','guardar','juntar','meta','objetivo'],
}

def _has_injection(s: str) -> bool:
    for pat in INJECTION_PATTERNS:
        if re.search(pat, s):
            return True
    return False

def _looks_financial(s: str) -> bool:
    return any(k in s for k in FINANCIAL_KWS)

def classify_intent(s: str) -> str:
    for intent, kws in INTENT_BUCKETS.items():
        if any(k in s for k in kws):
            return intent
    # fallback
    return "general_finance"

def validate_and_classify_prompt(prompt: str) -> Dict:
    out = {"is_valid": True, "errors": [], "warnings": [], "lang": None, "intent": "general_finance", "normalized": ""}

    if not prompt or not isinstance(prompt, str):
        out["is_valid"] = False
        out["errors"].append("Prompt inválido")
        return out

    text = prompt.strip()
    if len(text) < MIN_LEN:
        out["is_valid"] = False
        out["errors"].append(f"Prompt muito curto (mínimo {MIN_LEN} caracteres)")
    if len(text) > MAX_LEN:
        out["is_valid"] = False
        out["errors"].append(f"Prompt muito longo (máximo {MAX_LEN} caracteres)")

    low = text.lower()
    if _has_injection(low):
        out["is_valid"] = False
        out["errors"].append("Conteúdo suspeito de prompt injection detectado")

    if not _looks_financial(low):
        out["warnings"].append("O texto não parece claramente financeiro; ajustei o contexto para finanças pessoais.")

    try:
        lang = detect_lang_code(text)
    except Exception:
        lang = None
    out["lang"] = lang

    out["intent"] = classify_intent(low)

    sanitized = re.sub(r'[<>{}\\]', '', text)
    sanitized = re.sub(r'\s+', ' ', sanitized).strip()
    out["normalized"] = sanitized[:MAX_LEN]

    return out

def validate_financial_prompt(prompt: str):
    r = validate_and_classify_prompt(prompt)
    return r["is_valid"], r["errors"]

def sanitize_prompt(prompt: str) -> str:
    r = validate_and_classify_prompt(prompt)
    return r["normalized"]
