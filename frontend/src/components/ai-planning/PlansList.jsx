import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription
} from "../../components/ui/Card";
import { IconButton } from "../../components/ui/Button";
import {
    Calendar,
    FileText,
    Eye,
    Trash2
} from "lucide-react";
import { EmptyState } from "../ui/EmptyState";
import { useEffect } from "react";

export default function PlansList({
    plans,
    onSelect,
    onRemove,
    refresh
}) {
    useEffect(() => {
        refresh();
    }, [refresh]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl sm:text-2xl font-bold">
                    Meus Planos Financeiros
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {plans.length} {plans.length === 1 ? "plano criado" : "planos criados"}
                </span>
            </div>
            {plans.length === 0 ? (
                <EmptyState variant="plans" />
            ) : (
                <div className="space-y-4">
                    {plans.map((plan) => (
                        <Card
                            key={plan.id}
                            className="hover:shadow-md transition-shadow"
                        >
                            <CardHeader>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="space-y-3 flex-1 min-w-0">
                                        <CardTitle className="truncate">
                                            {plan.title}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {plan.description}
                                        </CardDescription>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                <span className="truncate">
                                                    Criado em{" "}
                                                    {new Date(plan.createdAt).toLocaleDateString("pt-BR")}
                                                </span>
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FileText className="h-4 w-4" />
                                                <span className="truncate">
                                                    {plan.templateTitle}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto sm:justify-end">
                                        <IconButton
                                            icon={Eye}
                                            onClick={() => onSelect(plan.id)}
                                            className="flex-1 sm:flex-none"
                                        />
                                        <IconButton
                                            icon={Trash2}
                                            onClick={() => onRemove(plan.id)}
                                            className="flex-1 sm:flex-none text-rose-600"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
