export const formatBRL = (value) =>
    Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatPercentage = (percent) =>
    percent == null ? "—" : `${Math.round(percent * 100)}%`;

export const getTrend = (changePercent) => {
    if (changePercent > 0) return "up";
    if (changePercent < 0) return "down";
    return undefined;
};