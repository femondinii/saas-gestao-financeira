export const formatBRL = (value) =>
    Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatPercentage = (percent) =>
    percent == null ? "—" : `${Math.round(percent * 100)}%`;

export const getTrend = (changePercent) => {
    if (changePercent > 0) return "up";
    if (changePercent < 0) return "down";
    return undefined;
};

export const parseBRLToNumber = (value) => {
    const str = (value ?? "").toString();
    const onlyDigits = str.replace(/\D/g, "");

    if (!onlyDigits) return 0;

    return Number(onlyDigits) / 100;
};