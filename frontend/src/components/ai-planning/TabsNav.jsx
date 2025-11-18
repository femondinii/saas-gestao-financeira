import { FileText, CheckCircle2, MessageSquare } from "lucide-react";

export default function TabsNav({ activeTab, onChange }) {
    const TabBtn = ({ id, icon: Icon, label }) => (
        <button
            type="button"
            onClick={() => onChange(id)}
            className={`flex items-center gap-2 px-2 sm:px-3 pb-3 border-b-2 text-sm sm:text-base whitespace-nowrap transition-colors ${
                activeTab === id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
        >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="font-medium">{label}</span>
        </button>
    );

    return (
        <div className="border-b border-gray-200 dark:border-neutral-800">
            <nav className="flex gap-4 sm:gap-6 overflow-x-auto">
                <TabBtn id="templates" icon={FileText} label="Templates" />
                <TabBtn id="custom" icon={MessageSquare} label="Criar com Prompt" />
                <TabBtn id="plans" icon={CheckCircle2} label="Meus Planos" />
            </nav>
        </div>
    );
}
