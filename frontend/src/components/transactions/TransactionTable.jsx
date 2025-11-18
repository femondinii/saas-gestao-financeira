import React, { useMemo } from "react";
import { Badge } from "../ui/Badge";
import { formatDateFlexible } from "../../utils/date";
import { InputCheckbox } from "../ui/Input";
import { formatBRL } from "../../utils/formatters";
import SimplePagination from "../ui/SimplePagination";
import { LoadingOverlay } from "../ui/Spinner";
import { EmptyState } from "../ui/EmptyState";
import { WalletBadge } from "../ui/WalletBadge";

export const TransactionTable = ({
    items = [],
    loading = false,
    selectedIds = new Set(),
    onToggleRow,
    onToggleAll,
    currentPage = 1,
    totalPages = 1,
    totalCount = 0,
    onPageChange
}) => {
    const allIds = useMemo(() => items.map((r) => r.id), [items]);
    const allChecked = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

    if (loading) {
        return <LoadingOverlay />;
    }

    if (!items.length) {
        return <EmptyState variant="transactions" />;
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[640px] text-xs sm:text-sm">
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
                            <Th>Carteira</Th>
                            <Th>Descrição</Th>
                            <Th className="hidden sm:table-cell">Categoria</Th>
                            <Th>Data</Th>
                            <Th className="text-right pr-4 sm:pr-6">Valor</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {items.map((t) => {
                            const isSelected = selectedIds.has(t.id);

                            return (
                                <tr
                                    key={t.id}
                                    className={
                                        isSelected ? "bg-blue-50/40" : "hover:bg-gray-50"
                                    }
                                    onClick={() => onToggleRow?.(t.id, !isSelected)}
                                >
                                    <Td className="w-10 px-4">
                                        <InputCheckbox
                                            id={`checkbox-${t.id}`}
                                            checked={isSelected}
                                            onChange={(e) =>
                                                onToggleRow?.(t.id, e.target.checked)
                                            }
                                        />
                                    </Td>
                                    <Td className="whitespace-nowrap">
                                        <WalletBadge color={t.color}>{t.wallet}</WalletBadge>
                                    </Td>
                                    <Td>{t.description}</Td>
                                    <Td className="hidden sm:table-cell">
                                        {t.category ? (
                                            <Badge tone="neutral">{t.category}</Badge>
                                        ) : (
                                            <Badge tone="default">Não preenchido</Badge>
                                        )}
                                    </Td>
                                    <Td className="whitespace-nowrap">
                                        {formatDateFlexible(t.date)}
                                    </Td>
                                    <Td className="text-right pr-4 sm:pr-6 font-semibold whitespace-nowrap">
                                        <span
                                            className={
                                                t.type === "income"
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            }
                                        >
                                            {t.type === "income" ? "+ " : "- "}
                                            {formatBRL(t.amount)}
                                        </span>
                                    </Td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="px-4 sm:px-6 pb-4">
                <SimplePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalCount={totalCount}
                    onPageChange={onPageChange}
                />
            </div>
        </div>
    );
};

const Th = ({ children, className = "" }) => (
    <th
        className={`text-left px-3 sm:px-6 py-3 font-medium text-xs sm:text-sm whitespace-nowrap ${className}`}
    >
        {children}
    </th>
);

const Td = ({ children, className = "" }) => (
    <td
        className={`px-3 sm:px-6 py-3 align-middle text-xs sm:text-sm ${
            children ? "" : "text-gray-400"
        } ${className}`}
    >
        {children || "Não preenchido"}
    </td>
);
