import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";
import { InputDate } from "../ui/Input";
import { Button } from "../ui/Button";
import {
  firstDayOfMonthISO,
  lastDayOfMonthISO,
  formatPtDate
} from "../../utils/date";

export default function PeriodSelect({ dateStart, dateEnd, onChange }) {
  const [openCustom, setOpenCustom] = useState(false);

  const currentValue = useMemo(() => {
    if (!dateStart || !dateEnd) {
      return "";
    }

    const now = new Date();
    const thisMonthStart = firstDayOfMonthISO(now);
    const thisMonthEnd = lastDayOfMonthISO(now);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStart = firstDayOfMonthISO(lastMonth);
    const lastMonthEnd = lastDayOfMonthISO(lastMonth);

    const dayOfWeek = now.getDay();
    const diffFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diffFromMonday);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const thisWeekStart = weekStart.toISOString().slice(0, 10);
    const thisWeekEnd = weekEnd.toISOString().slice(0, 10);

    if (dateStart === thisMonthStart && dateEnd === thisMonthEnd) return "this_month";
    if (dateStart === lastMonthStart && dateEnd === lastMonthEnd) return "last_month";
    if (dateStart === thisWeekStart && dateEnd === thisWeekEnd) return "this_week";

    return "custom";
  }, [dateStart, dateEnd]);

  const displayValue = useMemo(() => {
    if (!dateStart || !dateEnd) return null;

    if (currentValue === "custom") {
      return `De ${formatPtDate(dateStart)} até ${formatPtDate(dateEnd)}`;
    }

    const labels = {
      this_month: "Este mês",
      last_month: "Último mês",
      this_week: "Esta semana"
    };

    return labels[currentValue];
  }, [currentValue, dateStart, dateEnd]);

  const generateDateRange = (period) => {
    const now = new Date();

    switch (period) {
      case "this_month":
        return [firstDayOfMonthISO(now), lastDayOfMonthISO(now)];

      case "last_month": {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return [firstDayOfMonthISO(lastMonth), lastDayOfMonthISO(lastMonth)];
      }

      case "this_week": {
        const dayOfWeek = now.getDay();
        const diffFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - diffFromMonday);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return [weekStart.toISOString().slice(0, 10), weekEnd.toISOString().slice(0, 10)];
      }

      default:
        return [dateStart, dateEnd];
    }
  };

  const handlePeriodChange = (period) => {
    if (period === "custom") {
      setOpenCustom(true);
      return;
    }

    const [start, end] = generateDateRange(period);
    onChange?.(start, end);
  };

  const handleCustomDateChange = (field, value) => {
    const newStart = field === "start" ? value : dateStart;
    const newEnd = field === "end" ? value : dateEnd;
    onChange?.(newStart, newEnd);
  };

  const closeCustomPanel = () => {
    setOpenCustom(false);
  };

  return (
    <div className="relative">
      <Select value={currentValue} onValueChange={handlePeriodChange}>
        <SelectTrigger className="h-10 w-full">
          <SelectValue placeholder="Período">
            {displayValue && (
              <span className={currentValue === "custom" ? "text-gray-900" : "text-gray-700"}>
                {displayValue}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="this_month">Este mês</SelectItem>
          <SelectItem value="last_month">Último mês</SelectItem>
          <SelectItem value="this_week">Esta semana</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {openCustom && (
        <div className="absolute z-40 mt-2 w-80 rounded-md border bg-white p-4 shadow-lg">
          <div className="mb-3 text-sm font-medium">Escolha o período</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">De</label>
              <InputDate
                value={dateStart}
                max={dateEnd}
                onChange={(value) => handleCustomDateChange("start", value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Até</label>
              <InputDate
                value={dateEnd}
                min={dateStart}
                onChange={(value) => handleCustomDateChange("end", value)}
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={closeCustomPanel}
              className="h-9 w-auto px-3"
            >
              Fechar
            </Button>
            <Button
              variant="primary"
              onClick={closeCustomPanel}
              className="h-9 w-auto px-3"
            >
              Aplicar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}