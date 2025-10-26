import { useEffect, useState } from "react";
import { Label } from "../ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";
import { CategoryCreateButton } from "./CategoryCreateButton";
import { api } from "../../lib/api";

export function CategorySelect({
  value,
  onChange,
  withCreate = false,
  className = "",
  placeholder = "Selecione a categoria",
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  async function refetch(selectByName) {
    setLoading(true);
    try {
      const res = await api.get("/finance/categories/");
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      const list = Array.isArray(data) ? data : (data.results ?? []);
      const mapped = list
        .map((c) => ({ id: String(c.id), name: c.name, is_system: !!c.is_system }))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      setItems(mapped);

      if (selectByName) {
        const found = mapped.find(
          (c) => c.name.toLowerCase() === String(selectByName).toLowerCase()
        );
        if (found && onChange) onChange(found.id);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCreated(payload) {
    if (payload && typeof payload === "object" && payload.id) {
      const created = {
        id: String(payload.id),
        name: payload.name,
        is_system: !!payload.is_system,
      };
      setItems((prev) => {
        const exists = prev.some((p) => p.id === created.id);
        const next = exists ? prev : [...prev, created];
        return next.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      });
      if (onChange) onChange(created.id);
      return;
    }
    if (typeof payload === "string") {
      refetch(payload);
    } else {
      refetch();
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {withCreate && (
        <div className="flex items-center">
          <Label>Categoria</Label>
          <CategoryCreateButton
            onCreated={handleCreated}
            items={items}
            refetch={refetch}
            loading={loading}
          />
        </div>
      )}

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 w-full">
          <SelectValue placeholder={loading ? "Carregando..." : placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-40 overflow-y-auto">
          {items.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
