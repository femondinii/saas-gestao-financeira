import { useState, useMemo, use } from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter
} from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Sparkles } from "lucide-react";
import PlanDetails from "./PlanDetails";
import { api } from "../../lib/api";
import { Toast } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const API_PATH = "/finance/ai/plan/";
const LOTTIE_URL = "https://lottie.host/020ea13d-0640-4080-b60b-5587bae71c7e/e1GwdVqNXN.lottie";

export default function TemplatesTab({ templates, selectedTemplate, onSelect, onSaved }) {
	const [loading, setLoading] = useState(false);
	const [loadingText, setLoadingText] = useState("");
	const [generated, setGenerated] = useState(null);
	const { toast, show, hide } = useToast();

	const selected = useMemo(
		() => templates.find(t => t.id === selectedTemplate) || null,
		[templates, selectedTemplate]
	);

	const handleGenerate = async () => {
		if (!selected) return;
		setLoading(true);
		setLoadingText("Gerando o plano com IA…");
		try {
			const body = {
				objective: selected.title,
				template: selected.title,
				with_context: true,
				save: false,
			};
			const res = await api.post(API_PATH, body, { withAuth: true });
			const json = await res.json().catch(() => ({}));

			if (!res.ok) {
				throw new Error(json?.detail || json?.error || `HTTP ${res.status}`);
			}

			const data = json?.data || {};
			const plan = data.title ? data : { title: selected.title, spec: data.spec || {} };
			setGenerated(plan);
			window.scrollTo({ top: 0, behavior: "smooth" });
			show({ tone: "success", title: "Plano gerado", message: "Revise abaixo e salve se estiver ok." });
		} catch (e) {
			show({ tone: "error", title: "Falha ao gerar plano", message: e.message || "Tente novamente." });
		} finally {
			setLoading(false);
			setLoadingText("");
		}
	};

	const handleSave = async () => {
		if (!generated) return;
		setLoading(true);
		setLoadingText("Salvando o plano…");
		try {
			const body = {
				objective: generated.title || selected?.title || "Plano Financeiro",
				template: selected?.title || "generico",
				with_context: true,
				save: true,
			};
			const res = await api.post(API_PATH, body, { withAuth: true });
			const json = await res.json().catch(() => ({}));

			if (!res.ok) {
				throw new Error(json?.detail || json?.error || `HTTP ${res.status}`);
			}

			setGenerated(null);
			if (typeof onSaved === "function") onSaved(json?.data);
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
		<div className="space-y-6 relative">
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

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{templates.map((template) => (
					<Card
						key={template.id}
						className={`cursor-pointer transition-all hover:border-blue-300 dark:hover:border-blue-700 ${selectedTemplate === template.id ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800" : ""}`}
						onClick={() => onSelect(template.id)}
					>
						<CardHeader className="pb-2">
							<CardTitle className="text-base">{template.title}</CardTitle>
							<CardDescription className="text-sm">{template.description}</CardDescription>
						</CardHeader>
						<CardFooter className="pt-0">
							<div className="flex flex-wrap gap-2">
								{template.tags.map((tag, idx) => (
									<span
										key={idx}
										className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-300"
									>
										{tag}
									</span>
								))}
							</div>
						</CardFooter>
					</Card>
				))}
			</div>

			{selectedTemplate && !generated && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Sparkles className="h-5 w-5 text-blue-500" />
							Gerar Plano a partir do Template
                        </CardTitle>
						<CardDescription>
							Clique para gerar um plano com base no template selecionado.
						</CardDescription>
					</CardHeader>
					<CardFooter className="flex gap-2">
						<Button
							onClick={handleGenerate}
							disabled={loading}
							className="w-full sm:w-auto inline-flex items-center gap-2 p-3"
						>
							{loading ? "Gerando..." : (<><Sparkles className="h-4 w-4 mr-1" />Gerar</>)}
						</Button>
					</CardFooter>
				</Card>
			)}

			{generated ? (
				<div className={`${loading ? "pointer-events-none select-none opacity-60" : ""} space-y-3`}>
					<PlanDetails
						plan={generated}
						onBack={handleCancel}
					/>
					<div className="flex flex-col sm:flex-row gap-2">
						<Button variant="outline" onClick={handleCancel} disabled={loading} className="w-full sm:w-auto inline-flex items-center gap-2 p-3">
							Cancelar
						</Button>
						<Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto inline-flex items-center gap-2 p-3">
							{loading ? "Salvando..." : "Salvar"}
						</Button>
					</div>
				</div>
			) : null}

			<Toast toast={toast} onClose={hide} />
		</div>
	);
}
