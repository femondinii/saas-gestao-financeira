import { useMemo, useState } from "react";
import { Button } from "../ui/Button";
import { Plus } from "lucide-react";
import { TransactionFormModal } from "./TransactionFormModal";
import { api } from "../../lib/api";

export const NewTransactionModal = ({ onTransactionCreated }) => {
  const [open, setOpen] = useState(false);

  const todayISO = useMemo(() => {
    const now = new Date();
    const off = now.getTimezoneOffset();
    const local = new Date(now.getTime() - off * 60 * 1000);
    return local.toISOString().slice(0, 10);
  }, []);

  async function submit(payload) {
    const res = await api.post("/finance/transactions/", payload);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const first =
        data?.detail ||
        data?.non_field_errors?.[0] ||
        Object.values(data || {})?.[0]?.[0] ||
        "Não foi possível criar a transação.";
      throw new Error(first);
    }
    const created = await res.json();
    onTransactionCreated?.(created);
  }

  return (
    <TransactionFormModal
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button className="w-full sm:w-auto inline-flex items-center gap-2 p-3">
          <Plus className="h-4 w-4" />
          Nova Transação
        </Button>
      }
      title="Nova Transação"
      submitText="Salvar Transação"
      successMessage="Transação criada com sucesso!"
      initialValues={{ date: todayISO }}
      onSubmit={submit}
    />
  );
};
