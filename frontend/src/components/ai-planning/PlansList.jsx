import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter
} from "../../components/ui/Card";
import { IconButton } from "../../components/ui/Button";
import { Calendar, FileText, Eye, Trash2 } from "lucide-react";
import { getStatusColor } from "./constants";
import { EmptyState } from "../ui/EmptyState";

export default function PlansList({ plans, onSelect, onRemove }) {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Meus Planos Financeiros</h2>
				<span className="text-sm text-gray-500 dark:text-gray-400">
					{plans.length} {plans.length === 1 ? "plano criado" : "planos criados"}
				</span>
			</div>
			{plans.length === 0 ? (
				<EmptyState variant="plans" />
			) : (
				<div className="space-y-4">
					{plans.map((plan) => (
						<Card key={plan.id} className="hover:shadow-md transition-shadow">
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="space-y-3 flex-1">
										<CardTitle>{plan.title}</CardTitle>
										<CardDescription>{plan.description}</CardDescription>
										<div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
											<span className="flex items-center gap-1">
												<Calendar className="h-4 w-4" />
												Criado em {new Date(plan.createdAt).toLocaleDateString("pt-BR")}
											</span>
											<span className="flex items-center gap-1">
												<FileText className="h-4 w-4" /> {plan.templateTitle}
											</span>
										</div>
									</div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <IconButton
                                            icon={Eye}
                                            onClick={() => onSelect(plan.id)}
                                        />
                                        <IconButton
                                            icon={Trash2}
                                            onClick={() => onRemove(plan.id)}
                                            className="text-rose-600"
                                        />
                                    </div>
								</div>
							</CardHeader>
							<CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
								<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(plan.status)}`}>
									{plan.status}
								</span>
							</CardFooter>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
