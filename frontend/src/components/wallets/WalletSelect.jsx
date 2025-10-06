import { useEffect, useState } from "react";
import { Label } from "../ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";
import { api } from "../../lib/api";

export function WalletSelect({
    value,
    onChange,
    placeholder = "Selecione a carteira",
    label,
    withCreate = false
}) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    async function refetch(selectByName) {
        setLoading(true);
        try {
            const res = await api.get("/finance/wallets/?is_archived=false");

            if (!res.ok) return;

            const data = await res.json().catch(() => ({}));
            const list = Array.isArray(data) ? data : (data.results ?? []);
            const mapped = list
                .map((w) => ({
                    id: String(w.id),
                    name: String(w.name || ""),
                }))
                .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

            setItems(mapped);

            if (selectByName) {
                const found = mapped.find(
                    (w) => w.name.toLowerCase() === String(selectByName).toLowerCase()
                );

                if (found && onChange) {
                    onChange(found.id);
                }
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={"space-y-2"}>
            {withCreate ? (
                <Label>{label}</Label>
            ) : null}
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder={loading ? "Carregando..." : placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {items.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                            {w.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}