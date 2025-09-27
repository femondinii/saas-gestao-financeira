import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  firstDayOfMonthISO,
  lastDayOfMonthISO,
  formatPtDate
} from "../../utils/date";

export default function PeriodSelect({ dateStart, dateEnd, onChange }) {
  const [openMenu, setOpenMenu] = useState(false);
  const [openCustom, setOpenCustom] = useState(false);
  const [mode, setMode] = useState("this_month");

  const label = useMemo(() => {
    if (mode === "custom" && dateStart && dateEnd) {
      return `De ${formatPtDate(dateStart)} até ${formatPtDate(dateEnd)}`;
    }
    if (mode === "last_month") return "Último mês";
    if (mode === "this_week") return "Esta semana";
    if (mode === "this_month") return "Este mês";
    return "Período";
  }, [mode, dateStart, dateEnd]);

  function applyRange(nextMode) {
    const now = new Date();
    let ds = dateStart;
    let de = dateEnd;

    if (nextMode === "this_month") {
      ds = firstDayOfMonthISO(now);
      de = lastDayOfMonthISO(now);
    } else if (nextMode === "last_month") {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      ds = firstDayOfMonthISO(d);
      de = lastDayOfMonthISO(d);
    } else if (nextMode === "this_week") {
      const day = now.getDay();
      const diffFromMonday = day === 0 ? 6 : day - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diffFromMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      ds = monday.toISOString().slice(0, 10);
      de = sunday.toISOString().slice(0, 10);
    }

    setMode(nextMode);
    setOpenMenu(false);
    setOpenCustom(false);
    onChange?.(ds, de, nextMode);
  }

  function openCustomPanel() {
    setMode("custom");
    setOpenCustom(true);
  }

  return (
    <div className={"relative lg:col-span-2"}>
      <button
        type="button"
        onClick={() => setOpenMenu(v => !v)}
        className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none flex items-center justify-between"
      >
        <span className={label.startsWith("De ") ? "text-gray-900" : "text-gray-500"}>{label}</span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {openMenu && (
        <div className="absolute z-30 mt-2 w-56 rounded-md border bg-white shadow">
          <button
            className="w-full px-3 py-2 text-left hover:bg-gray-50"
            onClick={() => applyRange("last_month")}
          >
            Último mês
          </button>
          <button
            className="w-full px-3 py-2 text-left hover:bg-gray-50"
            onClick={() => applyRange("this_week")}
          >
            Esta semana
          </button>
          <button
            className="w-full px-3 py-2 text-left hover:bg-gray-50"
            onClick={() => applyRange("this_month")}
          >
            Este mês
          </button>
          <button
            className="w-full px-3 py-2 text-left hover:bg-gray-50"
            onClick={openCustomPanel}
          >
            Personalizado
          </button>
        </div>
      )}

      {openCustom && (
        <div className="absolute z-40 mt-2 w-80 rounded-md border bg-white p-4 shadow">
          <div className="mb-3 text-sm font-medium">Escolha o período</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-600 mb-1">De</div>
              <input
                type="date"
                value={dateStart || ""}
                max={dateEnd || undefined}
                onChange={(e) => onChange?.(e.target.value, dateEnd || e.target.value, "custom")}
                className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Até</div>
              <input
                type="date"
                value={dateEnd || ""}
                min={dateStart || undefined}
                onChange={(e) => onChange?.(dateStart || e.target.value, e.target.value, "custom")}
                className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              className="h-9 rounded-md border px-3 text-sm hover:bg-gray-50"
              onClick={() => { setOpenCustom(false); setOpenMenu(false); }}
            >
              Fechar
            </button>
            <button
              className="h-9 rounded-md bg-blue-600 px-3 text-sm text-white hover:bg-blue-700"
              onClick={() => { setOpenCustom(false); setOpenMenu(false); }}
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
