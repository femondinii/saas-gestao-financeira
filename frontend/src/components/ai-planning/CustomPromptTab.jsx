import { useMemo, useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import PlanDetails from "./PlanDetails";
import { api } from "../../lib/api";
import { Wand2, Lightbulb } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { validateFinancialPromptLocal, sanitizePromptLocal } from "../../utils/financialPromptValidator";
import { useToast } from "../../hooks/useToast";
import { Toast } from "../../components/ui/Toast";

const API_PATH = "/finance/ai/plan/";
const LOTTIE_URL = "https://lottie.host/020ea13d-0640-4080-b60b-5587bae71c7e/e1GwdVqNXN.lottie";

export default function CustomPromptTab({ onSaved }) {
	const [customPrompt, setCustomPrompt] = useState("");
	const [issues, setIssues] = useState([]);
	const [loading, setLoading] = useState(false);
	const [loadingText, setLoadingText] = useState("");
	const [error, setError] = useState("");
	const [generated, setGenerated] = useState(null);
	const { show, toast, hide } = useToast();

	useEffect(() => {
		setIssues(validateFinancialPromptLocal(customPrompt));
	}, [customPrompt]);

	const canGenerate = useMemo(() => customPrompt.trim().length > 0 && issues.length === 0, [customPrompt, issues]);
	const chars = customPrompt.length;

	const handleGenerateFromPrompt = async () => {
		if (!canGenerate) return;
		setLoading(true);
		setLoadingText("Gerando o plano com IA…");
		setError("");
		try {
			const safePrompt = sanitizePromptLocal(customPrompt);
			const body = {
				prompt: safePrompt,
				objective: "Plano Personalizado",
				template: "custom",
				with_context: true,
				save: false,
			};
			const res = await api.post(API_PATH, body, { withAuth: true });
			const json = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(json?.detail || json?.error || `HTTP ${res.status}`);
			const data = json?.data || {};
			const plan = data.title ? data : { title: "Plano Personalizado", spec: data.spec || {} };
			setGenerated(plan);
			window.scrollTo({ top: 0, behavior: "smooth" });
			show({ tone: "success", title: "Plano gerado", message: "Revise abaixo e salve se estiver ok" });
		} catch (e) {
			show({ tone: "error", title: "Falha ao gerar plano", message: e.message || "Tente novamente" });
		} finally {
			setLoading(false);
			setLoadingText("");
		}
	};

	const handleSave = async () => {
		if (!generated) return;
		setLoading(true);
		setLoadingText("Salvando o plano…");
		setError("");
		try {
			const safePrompt = sanitizePromptLocal(customPrompt);
			const body = {
				prompt: safePrompt,
				objective: generated.title || "Plano Personalizado",
				template: "custom",
				with_context: true,
				save: true,
			};
			const res = await api.post(API_PATH, body, { withAuth: true });
			const json = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(json?.detail || json?.error || `HTTP ${res.status}`);
			setGenerated(null);
			if (typeof onSaved === "function") onSaved(json?.data);
			setCustomPrompt("");
			show({ tone: "success", title: "Plano salvo", message: "Seu plano foi salvo com sucesso." });
		} catch (e) {
			show({ tone: "error", title: "Erro ao salvar plano", message: e.message || "Tente novamente." });
		} finally {
			setLoading(false);
			setLoadingText("");
		}
	};

	const handleCancel = () => setGenerated(null);

	return (
		<div className="space-y-4 relative">
			{loading && (
				<div className="absolute inset-0 z-20 grid place-items-center bg-white/70 dark:bg-neutral-950/60 backdrop-blur-sm">
					<div className="flex flex-col items-center gap-3 p-4">
						<div className="w-40 h-40">
							<DotLottieReact src={LOTTIE_URL} loop autoplay />
						</div>
						<p className="text-sm text-muted-foreground">{loadingText || "Processando…"}</p>
					</div>
				</div>
			)}

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Wand2 className="h-5 w-5 text-blue-500" />
						<span>Criar Plano Personalizado</span>
					</CardTitle>
					<CardDescription>
						Descreva em detalhes o que você gostaria de planejar financeiramente e nossa IA criará um plano personalizado para você.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<label className="text-sm font-medium">Descreva seu objetivo financeiro</label>
							<span className={`text-xs ${chars > 2000 ? "text-red-600" : "text-muted-foreground"}`}>{chars}/2000</span>
						</div>
						<textarea
							placeholder="Ex: Quero economizar R$ 50.000 em 2 anos para comprar um carro novo. Tenho renda mensal de R$ 5.000 e consigo guardar cerca de R$ 1.500 por mês. Quero estratégia de investimento e como organizar meu orçamento…"
							className="min-h-[150px] w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
							value={customPrompt}
							onChange={(e) => setCustomPrompt(e.target.value)}
						/>
						{issues.length > 0 && (
							<ul className="mt-1 text-xs text-red-600 dark:text-red-400 space-y-1">
								{issues.map((msg, i) => (
									<li key={i}>• {msg}</li>
								))}
							</ul>
						)}
						<p className="text-xs text-muted-foreground">
							Seja específico: inclua valores, prazos, sua situação atual e objetivos detalhados.
						</p>
					</div>

					<div className="rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
						<h4 className="font-medium text-sm mb-2 flex items-center gap-2">
							<Lightbulb className="h-4 w-4 text-blue-500" />
							Dicas para um prompt eficaz
						</h4>
						<ul className="text-xs text-muted-foreground space-y-1">
							<li>• Informe sua renda mensal atual</li>
							<li>• Detalhe seus gastos principais</li>
							<li>• Especifique valor-alvo e prazo</li>
							<li>• Mencione seu perfil de risco (conservador, moderado)</li>
							<li>• Inclua restrições ou preferências</li>
						</ul>
					</div>
				</CardContent>
				<CardFooter>
					<Button
						onClick={handleGenerateFromPrompt}
						disabled={loading || !canGenerate}
						className="w-full sm:w-auto inline-flex items-center gap-2 p-3"
					>
						{loading ? "Processando…" : (
							<>
								<Wand2 className="h-4 w-4" />
								Criar Plano Personalizado
							</>
						)}
					</Button>
				</CardFooter>
			</Card>

			{error ? <div className="text-sm text-red-600 dark:text-red-400">{error}</div> : null}

			{generated ? (
				<div className={`${loading ? "pointer-events-none select-none opacity-60" : ""} space-y-3`}>
					<PlanDetails plan={generated} onBack={handleCancel} />
					<div className="flex flex-col sm:flex-row gap-2">
						<Button
							variant="outline"
							onClick={handleCancel}
							disabled={loading}
							className="w-full sm:w-auto gap-2 inline-flex items-center p-3"
						>
							Cancelar
						</Button>
						<Button
							onClick={handleSave}
							disabled={loading}
							className="w-full sm:w-auto gap-2 inline-flex items-center p-3"
						>
							Salvar
						</Button>
					</div>
				</div>
			) : null}

			<Toast toast={toast} onClose={hide} />
		</div>
	);
}
