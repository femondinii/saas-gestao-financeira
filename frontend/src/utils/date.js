const toISO = (d) => {
  const dt = typeof d === "string" ? new Date(d) : d;
  const off = dt.getTimezoneOffset();
  const local = new Date(dt.getTime() - off * 60 * 1000);

  return local.toISOString().slice(0, 10);
}

export const firstDayOfMonthISO = (d = new Date()) => {
    return toISO(new Date(d.getFullYear(), d.getMonth(), 1));
}

export const lastDayOfMonthISO = (d = new Date()) => {
    return toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export const formatDateFlexible = (d) => {
    if (!d) return "—";
    if (typeof d === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;

    try {
        const [y, m, day] = String(d).split("-").map(Number);
        const dt = new Date(y, (m || 1) - 1, day || 1);

        return dt.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return String(d);
    }
}

export const formatPtDate = (iso) => {
    if (!iso) return "";

    const [y, m, day] = iso.split("-").map(Number);
    const d = new Date(y, m - 1, day);

    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
