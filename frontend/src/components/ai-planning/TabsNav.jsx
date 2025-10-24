import {
    FileText,
    CheckCircle2,
    MessageSquare
} from "lucide-react";

export default function TabsNav({ activeTab, onChange }) {
    const TabBtn = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => onChange(id)}
            className={`flex items-center gap-2 pb-4 border-b-2 transition-colors ${
                activeTab === id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
        >
            <Icon className="h-4 w-4" />
            <span className="font-medium">{label}</span>
        </button>
    );

    return (
        <div className="border-b border-gray-200 dark:border-neutral-800">
            <nav className="flex gap-6">
                <TabBtn
                    id="templates"
                    icon={FileText}
                    label="Templates"
                />
                <TabBtn
                    id="custom"
                    icon={MessageSquare}
                    label="Criar com Prompt"
                />
                <TabBtn
                    id="plans"
                    icon={CheckCircle2}
                    label="Meus Planos"
                />
            </nav>
        </div>
    );
}