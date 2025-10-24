const financialKeywords = [
	"economizar","poupar","investir","dinheiro","reais","r$","renda","salário","despesa","receita","financeiro","financeira",
	"orçamento","meta","objetivo","guardar","juntar","gastar","pagar","dívida","conta","banco","cartão","comprar","vender",
	"lucro","prejuízo","saldo","valor","custo","preço","taxa","juros","inflação","imposto","tributo","aporte","diversificação","financiar"
];

const injectionPatterns = [
	/ignore\s+(previous|above|all|earlier)\s+instructions?/i,
	/disregard\s+(previous|above|all)\s+instructions?/i,
	/system\s*:/i,
	/you\s+are\s+(now|a|an)\s+/i,
	/forget\s+(everything|all|previous|what)/i,
	/new\s+instructions?/i,
	/<\s*script/i,
	/javascript:/i,
	/eval\s*\(/i,
	/pretend\s+to\s+be/i,
	/roleplay\s+as/i,
	/act\s+as\s+(if|a|an)/i,
	/override\s+/i,
	/sudo\s+/i,
	/\{\{.*?\}\}/i,
	/execute\s+/i,
	/run\s+code/i
];

export function validateFinancialPromptLocal(text) {
	const errs = [];
	const s = (text || "").trim();

	if (s.length < 20) errs.push("Mínimo de 20 caracteres.");
	if (s.length > 2000) errs.push("Máximo de 2000 caracteres.");

	const lower = s.toLowerCase();

	if (!financialKeywords.some(k => lower.includes(k))) {
		errs.push("O conteúdo deve tratar de finanças pessoais.");
	}

	if (injectionPatterns.some(rx => rx.test(s))) {
		errs.push("Conteúdo suspeito detectado.");
	}

	return errs;
}

export function sanitizePromptLocal(text) {
	return (text || "")
		.replace(/[<>{}\\]/g, "")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, 2000);
}