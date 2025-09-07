import React from "react";
import { Badge } from "../ui/Badge";

export default function TransactionTable({ items = [], loading = false }) {
    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
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
                    <Th>Descrição</Th>
                    <Th>Categoria</Th>
                    <Th>Data</Th>
                    <Th className="text-right pr-6">Valor</Th>
                </tr>
                </thead>
                <tbody className="divide-y">
                    {items.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50">
                        <Td>{t.description || "-"}</Td>
                        <Td>
                            {t.category_detail ? (
                            <Badge tone="neutral">{t.category_detail.name}</Badge>
                            ) : (
                            <span className="text-gray-400">Sem categoria</span>
                            )}
                        </Td>
                        <Td>{formatDate(t.date)}</Td>
                        <Td className="text-right pr-6 font-semibold">
                            <span
                            className={
                                t.type === "income" ? "text-green-600" : "text-red-600"
                            }
                            >
                            {t.type === "income" ? "+" : "-"} {formatBRL(t.amount)}
                            </span>
                        </Td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Th({ children, className = "" }) {
    return (
        <th className={`text-left px-6 py-3 font-medium ${className}`}>
            {children}
        </th>
    );
}
function Td({ children, className = "" }) {
    return <td className={`px-6 py-3 ${className}`}>{children}</td>;
}

function formatBRL(v) {
    return Number(v).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}
function formatDate(s) {
    try {
        const d = new Date(s);

        return d.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return s;
    }
}
