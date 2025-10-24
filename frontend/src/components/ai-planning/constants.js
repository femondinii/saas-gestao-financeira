export const AI_TEMPLATES = [
    { id: 1, title: "Orçamento Mensal", description: "Crie um plano detalhado para controlar despesas mensais.", tags: ["Orçamento", "Básico"] },
    { id: 2, title: "Plano de Aposentadoria", description: "Estratégias para investimentos de longo prazo visando a aposentadoria.", tags: ["Investimento", "Longo Prazo"] },
    { id: 3, title: "Quitação de Dívidas", description: "Estratégia passo a passo para eliminar dívidas de forma eficiente.", tags: ["Dívidas", "Médio Prazo"] },
    { id: 4, title: "Compra de Imóvel", description: "Planejamento financeiro para aquisição de imóvel.", tags: ["Imóvel", "Longo Prazo"] },
    { id: 5, title: "Educação dos Filhos", description: "Estratégia para guardar dinheiro para a educação superior dos filhos.", tags: ["Família", "Longo Prazo"] },
    { id: 6, title: "Viagem dos Sonhos", description: "Planejamento financeiro para realizar uma viagem especial.", tags: ["Lazer", "Curto Prazo"] },
];

export const getStatusColor = (status) => {
    switch (status) {
        case "Ativo":
            return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
        case "Em Progresso":
            return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
        case "Concluído":
            return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
        default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
};

export const getSeverityColor = (severity) => {
    switch (severity) {
        case "Alto":
            return "bg-red-500";
        case "Médio":
            return "bg-amber-500";
        default:
            return "bg-green-500";
    }
};