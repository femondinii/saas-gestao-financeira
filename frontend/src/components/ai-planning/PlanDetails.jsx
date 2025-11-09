import { useMemo, useState } from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent
} from "../../components/ui/Card";
import { Button, IconButton } from "../../components/ui/Button";
import {
	ArrowLeft,
	Info,
	Lightbulb,
	Target,
	AlertTriangle,
	Calendar,
	NotebookPen
} from "lucide-react";
import { getSeverityColor } from "./constants";
import { formatBRL } from "../../utils/formatters";
import { Badge } from "../ui/Badge";
import { api } from "../../lib/api";
import { useToast } from "../../hooks/useToast";
import { Toast } from "../ui/Toast";

const SafeText = ({ text, fallback = "—" }) => (
	<p className="text-sm text-muted-foreground whitespace-pre-wrap">{text || fallback}</p>
);
const fmtBRL = (v) => (v === null || v === undefined ? "—" : formatBRL(v));

export default function PlanDetails({
	plan,
	onBack,
	isCreating = false,
	template,
	onSaved
}) {
	const [saving, setSaving] = useState(false);
	const { toast, show, hide } = useToast();

	const planSpec = useMemo(() => (plan?.spec ? plan.spec : plan) || {}, [plan]);

	const llmGoals = useMemo(() => {
		if (Array.isArray(planSpec?.goals?.items)) {
			return planSpec.goals.items;
		}

		if (Array.isArray(planSpec?.goals?.current)) {
			return planSpec.goals.current;
		}

		return [];
	}, [planSpec]);

	const llmSuggestions = useMemo(() => {
		if (Array.isArray(planSpec?.suggestions?.goals)) {
			return planSpec.suggestions.goals;
		}

		if (Array.isArray(planSpec?.goals?.suggested)) {
			return planSpec.goals.suggested;
		}

		return [];
	}, [planSpec]);

	const overviewInsights = Array.isArray(planSpec?.overview?.insights) ? planSpec.overview.insights : [];

	const handleSave = async () => {
		if (!isCreating) {
			return;
		}

		try {
			setSaving(true);

			const payload = {
				title: planSpec?.title || plan?.title,
				template: plan?.template,
				objective: plan?.objective,
				spec: planSpec,
			};

			const res = await api.post("/finance/ai/plans/", payload, { withAuth: true });
			const json = await res.json().catch(() => ({}));

			if (!res.ok) {
				throw new Error(json?.detail || json?.error || `HTTP ${res.status}`);
			}

			onSaved?.(json?.data);
			show({
				tone: "success",
				title: "Plano salvo",
				message: "Seu plano foi salvo com sucesso."
			});

			onBack?.();
		} catch (e) {
			show({
				tone: "error",
				title: "Erro ao salvar plano",
				message: e?.message || "Tente novamente.",
			});
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<IconButton icon={ArrowLeft} onClick={onBack} />
				<h2 className="text-2xl font-bold">{planSpec?.title || plan?.title}</h2>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Info className="h-5 w-5 text-blue-500" />
						Visão Geral
					</CardTitle>
					<CardDescription>Objetivo e visão resumida do plano</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-lg border p-3">
						<p className="text-xs text-muted-foreground mb-1">Objetivo</p>
						<p className="font-medium">{planSpec?.overview?.objective || "—"}</p>
					</div>
					<div>
						<p className="text-sm font-medium mb-1">Resumo</p>
						<SafeText text={planSpec?.overview?.summary} fallback="Adicione um resumo curto do plano." />
					</div>
					{overviewInsights.length > 0 && (
						<div className="space-y-2">
							<p className="text-sm font-medium">Pontos específicos do seu contexto</p>
							<ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
								{overviewInsights.map((it, i) => <li key={i}>{it}</li>)}
							</ul>
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<NotebookPen className="h-5 w-5 text-blue-500" />
						{planSpec?.strategy?.title || "Estratégia Principal"}
					</CardTitle>
					<CardDescription>Como alcançar o objetivo</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<SafeText text={planSpec?.strategy?.text} fallback="Descreva a estratégia principal sugerida pela IA." />
					{Array.isArray(planSpec?.strategy?.steps) && planSpec.strategy.steps.length > 0 && (
						<div>
							<p className="text-sm font-medium mb-1">Passos sugeridos</p>
							<ol className="list-none pl-5 text-sm space-y-1">
								{planSpec.strategy.steps.map((s, i) => <li key={i}>{s}</li>)}
							</ol>
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<Target className="h-5 w-5 text-blue-500" />
							Metas
						</CardTitle>
					</div>
					<CardDescription>Lista de metas sugeridas pela IA</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{llmGoals.length === 0 ? (
						<p className="text-sm text-muted-foreground">Nenhuma meta definida.</p>
					) : (
						<div className="space-y-3">
							{llmGoals.map((g, idx) => {
								const key = g.id || `${g.title}-${g.deadline || idx}`;
								return (
									<div key={key} className="rounded-lg border p-4">
										<div className="flex items-start justify-between gap-4">
											<div className="space-y-1">
												<p className="font-semibold">{g.title || "Meta"}</p>
												{g.description ? <p className="text-muted-foreground">{g.description}</p> : null}
											</div>
											<div className="text-right text-sm">
												<p className="text-muted-foreground">Meta</p>
												<p className="font-semibold">{fmtBRL(g.target)}</p>
											</div>
										</div>
										<div className="mt-3 grid gap-3 sm:grid-cols-3">
											<div className="text-sm">
												<p className="text-muted-foreground">Atual</p>
												<p className="font-medium">{fmtBRL(g.current)}</p>
											</div>
											<div className="text-sm">
												<p className="text-muted-foreground">Prazo</p>
												<p className="font-medium flex items-center gap-1">
													<Calendar className="h-3 w-3" />
													{g.deadline || "—"}
												</p>
											</div>
											<div className="text-sm">
												<p className="text-muted-foreground">Categoria</p>
												{g.category ? <Badge tone="neutral">{g.category}</Badge> : <p className="font-medium">—</p>}
											</div>
										</div>
										{Array.isArray(g?.notes) && g.notes.length > 0 && (
											<div className="mt-3">
												<p className="text-sm font-medium">Notas específicas</p>
												<ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
													{g.notes.map((n, i) => <li key={i}>{n}</li>)}
												</ul>
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<Lightbulb className="h-5 w-5 text-blue-500" />
							Sugestões
						</CardTitle>
					</div>
					<CardDescription>Ideias adicionais sugeridas pela IA</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{llmSuggestions.length === 0 ? (
						<p className="text-sm text-muted-foreground">Sem sugestões no momento.</p>
					) : (
						<div className="space-y-3">
							{llmSuggestions.map((s, idx) => {
								const key = s.id || `${s.title}-${s.deadline || idx}`;
								return (
									<div key={key} className="rounded-lg border p-4">
										<div className="flex items-start justify-between gap-4">
											<div className="space-y-1">
												<p className="font-semibold">{s.title}</p>
												{s.description ? <p className="text-muted-foreground">{s.description}</p> : null}
											</div>
											<div className="text-right text-sm">
												<p className="text-muted-foreground">Meta</p>
												<p className="font-semibold">{fmtBRL(s.target)}</p>
											</div>
										</div>
										<div className="mt-3 grid gap-3 sm:grid-cols-2">
											<div className="text-sm">
												<p className="text-muted-foreground">Prazo</p>
												<p className="font-medium">{s.deadline || "—"}</p>
											</div>
											<div className="text-sm">
												<p className="text-muted-foreground">Categoria</p>
												{s.category ? <Badge tone="neutral">{s.category}</Badge> : <p className="font-medium">—</p>}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>

			{Array.isArray(planSpec?.risks) && planSpec.risks.length > 0 ? (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-amber-500" />
							Riscos
						</CardTitle>
						<CardDescription>Possíveis obstáculos e suas mitigações</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{planSpec.risks.map((r, i) => (
							<Card key={r.id || r.title || i} className="overflow-hidden">
								<div className={`h-3 w-full ${getSeverityColor(r.severity)}`} />
								<CardContent className="p-4 text-sm space-y-2">
									<div className="pt-4 flex items-start justify-between gap-4">
										<p className="font-semibold text-base">{r.title}</p>
										{r.severity ? <Badge tone="neutral">{r.severity}</Badge> : null}
									</div>
									{r.description ? <p className="text-muted-foreground">{r.description}</p> : null}
									{r.likelihood ? <p><span className="font-medium">Probabilidade:</span> {r.likelihood}</p> : null}
									{r.impact ? <p><span className="font-medium">Impacto:</span> {r.impact}</p> : null}
									{r.mitigation ? (
										<p><span className="font-medium">Mitigação:</span> {r.mitigation}</p>
									) : null}
								</CardContent>
							</Card>
						))}
					</CardContent>
				</Card>
			) : null}

			{isCreating && (
				<div className="flex flex-col sm:flex-row gap-2">
					<Button
						variant="outline"
						onClick={onBack}
						disabled={saving}
						className="w-full sm:w-auto gap-2 inline-flex items-center p-3"
					>
						Cancelar
					</Button>
					<Button
						onClick={handleSave}
						disabled={saving}
						className="w-full sm:w-auto gap-2 inline-flex items-center p-3"
					>
						{saving ? "Salvando…" : "Salvar"}
					</Button>
				</div>
			)}
			<Toast toast={toast} onClose={hide} />
		</div>
	);
}
