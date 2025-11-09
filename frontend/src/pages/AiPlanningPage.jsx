import { useMemo, useState } from "react";
import TitlePage from "../components/layout/TitlePage";
import { AlertModal } from "../components/ui/AlertModal";
import TabsNav from "../components/ai-planning/TabsNav";
import TemplatesTab from "../components/ai-planning/TemplatesTab";
import PlansList from "../components/ai-planning/PlansList";
import PlanDetails from "../components/ai-planning/PlanDetails";
import { AI_TEMPLATES } from "../components/ai-planning/constants";
import { usePlans } from "../components/ai-planning/usePlans";
import { Spinner } from "../components/ui/Spinner";
import CustomPromptTab from "../components/ai-planning/CustomPromptTab";

export default function AiPlanningPage() {
	const [activeTab, setActiveTab] = useState("templates");
	const [selectedTemplate, setSelectedTemplate] = useState(null);
	const [selectedPlanId, setSelectedPlanId] = useState(null);
	const [deleteModal, setDeleteModal] = useState({ open: false, planId: null });

	const { items: plans, loading: plansLoading, error: plansError, remove: removePlan, refresh } = usePlans();
	const selectedPlan = useMemo(() => plans.find((p) => p.id === selectedPlanId), [plans, selectedPlanId]);

	const openDeleteModal = (planId) => setDeleteModal({ open: true, planId });
	const closeDeleteModal = () => setDeleteModal({ open: false, planId: null });
	const confirmDeletePlan = async () => {
		if (deleteModal.planId) {
			try {
				await removePlan(deleteModal.planId);
				if (selectedPlanId === deleteModal.planId) setSelectedPlanId(null);
			} catch {
			}
		}
		closeDeleteModal();
	};

	const handlePlansSelect = (idOrCommand) => {
		if (idOrCommand === "__go_templates") setActiveTab("templates");
		else setSelectedPlanId(idOrCommand);
	};

	return (
		<div className="space-y-6 animate-fade-in">
			<TitlePage
				title="Planejamento com IA"
				subtitle="Crie planos financeiros personalizados com ajuda de inteligência artificial"
			/>
			<TabsNav
				activeTab={activeTab}
				onChange={setActiveTab}
			/>
			{activeTab === "templates" && (
				<TemplatesTab
					templates={AI_TEMPLATES}
					selectedTemplate={selectedTemplate}
					onSelect={setSelectedTemplate}
					onSaved={() => {
						setActiveTab("plans");
						refresh();
					}}
				/>
			)}
			{activeTab === "plans" && !selectedPlan && (
				<>
					{plansLoading ? (
						<Spinner size="lg" centered />
					) : null}
					{plansError ? <p className="text-sm text-red-600">{plansError}</p> : null}
					<PlansList
						plans={plans}
						onSelect={handlePlansSelect}
						onRemove={openDeleteModal}
						refresh={refresh}
					/>
				</>
			)}
			{activeTab === "plans" && selectedPlan && (
				<PlanDetails
					plan={selectedPlan}
					onBack={() => setSelectedPlanId(null)}
				/>
			)}
			{activeTab === "custom" && (
				<CustomPromptTab onSaved={() => setActiveTab("custom")} />
			)}
			<AlertModal
				open={deleteModal.open}
				title="Remover Plano"
				message="Tem certeza que deseja remover este plano? Esta ação não pode ser desfeita."
				danger
				onConfirm={confirmDeletePlan}
				onCancel={closeDeleteModal}
			/>
		</div>
	);
}
