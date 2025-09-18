import React, { useMemo } from "react";
import { Badge } from "../ui/Badge";
import { formatDateFlexible } from "../../utils/date";
import { InputCheckbox } from "../ui/Input";

export const TransactionTable = ({
  items = [],
  loading = false,
  selectedIds = new Set(),
  onToggleRow,
  onToggleAll
}) => {
    const allIds = useMemo(() => items.map((r) => r.id), [items]);
    const allChecked = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

    if (loading) {
        return (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500">
            Carregando...
        </div>
        );
    }

    if (!items.length) {
        return (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500">
            Nenhuma transação encontrada.
        </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                <tr>
                    <Th className="w-10 px-4">
                        <InputCheckbox
                            id="checkbox-all"
                            checked={allChecked}
                            onChange={(e) => onToggleAll?.(e.target.checked)}
                            ariaLabel="Selecionar tudo"
                        />
                    </Th>
                    <Th>Descrição</Th>
                    <Th>Categoria</Th>
                    <Th>Data</Th>
                    <Th className="text-right pr-6">Valor</Th>
                </tr>
                </thead>
                <tbody className="divide-y">
                {items.map((t) => {
                    const isSelected = selectedIds.has(t.id);

                    return (
                        <tr key={t.id} className={isSelected ? "bg-blue-50/40" : "hover:bg-gray-50"}>
                            <Td className="w-10 px-4">
                                <InputCheckbox
                                    id={`checkbox-${t.id}`}
                                    checked={isSelected}
                                    onChange={(e) => onToggleRow?.(t.id, e.target.checked)}
                                />
                            </Td>
                            <Td>{t.description || "Sem descrição"}</Td>
                            <Td>
                                {t.category ? (
                                    <Badge tone="neutral">{t.category}</Badge>
                                ) : (
                                    <span className="text-gray-400">Sem categoria</span>
                                )}
                            </Td>
                            <Td>{formatDateFlexible(t.date)}</Td>
                            <Td className="text-right pr-6 font-semibold">
                                <span className={t.type === "income" ? "text-green-600" : "text-red-600"}>
                                    {t.type === "income" ? "+ " : "- "}
                                    {formatBRL(Math.abs(t.amount))}
                                </span>
                            </Td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};

const Th = ({ children, className = "" }) => (
    <th className={`text-left px-6 py-3 font-medium ${className}`}>{children}</th>
);

const Td = ({ children, className = "" }) => (
    <td className={`px-6 py-3 ${className}`}>{children}</td>
);

const formatBRL = (v) =>
    Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
