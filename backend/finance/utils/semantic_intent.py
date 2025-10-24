from __future__ import annotations
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class IntentDef:
	label: str
	keywords: Dict[str, float]
	negatives: List[str] | None = None

FIN_INTENTS: List[IntentDef] = [
	IntentDef(
		label="orcamento",
		keywords={
			"orçamento": 1.0, "orcamento": 1.0, "planejamento": 0.9, "gastos": 0.9,
			"despesas": 1.0, "receitas": 0.9, "poupar": 0.9, "economizar": 1.0,
			"metas": 0.6, "objetivo": 0.4, "saldo": 0.6, "dinheiro": 0.5
		},
		negatives=["piada", "história", "politica", "jogo", "programação"]
	),
	IntentDef(
		label="investimentos",
		keywords={
			"investir": 1.0, "investimentos": 1.0, "renda fixa": 0.7, "tesouro": 0.9,
			"cdb": 0.9, "selic": 0.7, "bolsa": 0.8, "ações": 0.8, "fundos": 0.6,
			"perfil de risco": 0.7, "rentabilidade": 0.6
		},
		negatives=["trader esportivo", "cassino", "aposta"]
	),
	IntentDef(
		label="dividas",
		keywords={
			"dívida": 1.0, "divida": 1.0, "cartão": 0.9, "cartao": 0.9, "juros": 0.9,
			"renegociar": 0.9, "quitar": 0.9, "parcelas": 0.7, "inadimplência": 0.7
		},
		negatives=[]
	),
	IntentDef(
		label="objetivos",
		keywords={
			"meta": 1.0, "objetivo": 1.0, "guardar": 0.9, "juntar": 0.9, "prazo": 0.7,
			"comprar": 0.6, "carro": 0.5, "imóvel": 0.7, "viagem": 0.6
		},
		negatives=[]
	),
]

NON_FINANCE_RED_FLAGS = [
	"ignore previous", "disregard instructions", "system:", "you are now",
	"roleplay", "sudo", "execute code", "run code", "javascript:", "eval(",
]

def _score(text: str, intent: IntentDef) -> float:
	t = f" {text.lower()} "
	score = 0.0
	for kw, w in intent.keywords.items():
		if kw in t:
			score += w

	if intent.negatives:
		for bad in intent.negatives:
			if bad in t:
				score -= 0.8
	return max(0.0, score)

def classify_intent(prompt: str) -> dict:
	text = prompt or ""
	if not text.strip():
		return {"is_financial": False, "label": None, "score": 0.0, "top": []}

	lower = text.lower()
	for red in NON_FINANCE_RED_FLAGS:
		if red in lower:
			return {"is_financial": False, "label": None, "score": 0.0, "top": []}

	scores = []
	for intent in FIN_INTENTS:
		s = _score(lower, intent)
		scores.append((intent.label, s))

	scores.sort(key=lambda x: x[1], reverse=True)
	best_label, best_score = scores[0]
	is_financial = best_score >= 1.2

	return {
		"is_financial": is_financial,
		"label": best_label if is_financial else None,
		"score": round(best_score, 3),
		"top": scores[:3],
	}
