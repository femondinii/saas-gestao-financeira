export const AI_TEMPLATES = [
    { id: 1, title: "Orçamento Mensal", description: "Crie um plano detalhado para controlar despesas mensais.", tags: ["Orçamento", "Básico"] },
    { id: 2, title: "Plano de Aposentadoria", description: "Estratégias para investimentos de longo prazo visando a aposentadoria.", tags: ["Investimento", "Longo Prazo"] },
    { id: 3, title: "Quitação de Dívidas", description: "Estratégia passo a passo para eliminar dívidas de forma eficiente.", tags: ["Dívidas", "Médio Prazo"] },
    { id: 4, title: "Compra de Imóvel", description: "Planejamento financeiro para aquisição de imóvel.", tags: ["Imóvel", "Longo Prazo"] },
    { id: 5, title: "Educação dos Filhos", description: "Estratégia para guardar dinheiro para a educação superior dos filhos.", tags: ["Família", "Longo Prazo"] },
    { id: 6, title: "Viagem dos Sonhos", description: "Planejamento financeiro para realizar uma viagem especial.", tags: ["Lazer", "Curto Prazo"] },
];

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