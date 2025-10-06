import { useState, useEffect } from "react";
import { TransactionFormModal } from "./TransactionFormModal";
import { api } from "../../lib/api";

export function EditTransactionModal({
  open,
  onOpenChange,
  transaction,
  onTransactionUpdated,
}) {
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    if (!open) {
      setInitialValues(null);
      return;
    }
    if (!transaction) return;
    const n = Number(transaction.amount);
    setInitialValues({
      description: transaction.description || "",
      amount: Number.isFinite(n) ? n : 0,
      categoryId: transaction.category || "",
      type: transaction.type || "",
      date: transaction.date || "",
      walletId: transaction.wallet || "",
    });
  }, [open, transaction]);

  async function submit(payload) {
    const res = await api.patch(`/finance/transactions/${transaction.id}/`, payload);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const first =
        data?.detail ||
        data?.non_field_errors?.[0] ||
        Object.values(data || {})?.[0]?.[0] ||
        "Não foi possível atualizar a transação.";
      throw new Error(first);
    }
    const updated = await res.json();
    onTransactionUpdated?.(updated);
  }

  if (!initialValues) return null;

  return (
    <TransactionFormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Editar Transação"
      submitText="Salvar alterações"
      successMessage="Transação atualizada com sucesso!"
      initialValues={initialValues}
      onSubmit={submit}
    />
  );
}
