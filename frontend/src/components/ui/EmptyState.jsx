import React from 'react';
import {
    FileX,
    CreditCard,
    PieChart
} from 'lucide-react';

export function EmptyState({ variant = 'default' }) {
    const variants = {
        default: {
            icon: FileX,
            title: 'Nenhum registro encontrado',
            description: 'Não há dados para exibir no momento.'
        },
        transactions: {
            icon: CreditCard,
            title: 'Nenhuma transação encontrada',
            description: 'Comece criando sua primeira transação financeira.'
        },
        charts: {
            icon: PieChart,
            title: 'Dados insuficientes',
            description: 'Adicione algumas transações para visualizar os gráficos.'
        },
    };

    const config = variants[variant];
    const Icon = config.icon;

    return (
        <div className={"flex flex-col items-center justify-center py-12 px-4 text-center"}>
            <div className="mb-4 rounded-full bg-gray-100 dark:bg-neutral-800 p-3">
                <Icon className="h-8 w-8 text-gray-400 dark:text-neutral-500" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                {config.title}
            </h3>
            <p className="mb-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                {config.description}
            </p>
        </div>
    );
}