import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";
import { Toast } from "../ui/Toast";
import { useToast } from "../../hooks/useToast";
import { Plus } from "lucide-react";
import { CategorySelect } from "../categories/CategorySelect";

export function NewTransactionModal({ onTransactionCreated }) {
  const [open, setOpen] = useState(false);

  const [description, setDescription] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState("");
  const [date, setDate] = useState("");

  const { toast, show, hide } = useToast();

  const todayISO = useMemo(() => {
    const now = new Date();
    const off = now.getTimezoneOffset();
    const local = new Date(now.getTime() - off * 60 * 1000);
    return local.toISOString().slice(0, 10);
  }, []);

  function normalizeAmount(str) {
    if (typeof str !== "string") return NaN;
    const clean = str.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(clean);
    return Number.isFinite(n) ? n : NaN;
  }

  function resetForm() {
    setDescription("");
    setAmountInput("");
    setCategoryId("");
    setType("");
    setDate("");
  }

  function handleSubmit(e) {
    e.preventDefault();

    const amt = normalizeAmount(amountInput);
    if (!description || !categoryId || !type || !date || !Number.isFinite(amt) || amt <= 0) {
      const msg =
        !Number.isFinite(amt) || amt <= 0
          ? "Informe um valor válido maior que zero."
          : "Por favor, preencha todos os campos.";
      show({ title: "Erro", message: msg, tone: "error" });
      return;
    }

    const signed = type === "expense" ? -Math.abs(amt) : Math.abs(amt);

    const newTransaction = {
      id: Date.now(),
      description: description.trim(),
      amount: signed,
      category_id: Number(categoryId),
      type,
      date: new Date(date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };

    onTransactionCreated?.(newTransaction);
    show({ title: "Sucesso", message: "Transação criada com sucesso!", tone: "success" });
    resetForm();
    setOpen(false);
  }

  function handleAmountChange(e) {
    let raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setAmountInput("");
      return;
    }
    const float = parseFloat(raw) / 100;
    const formatted = float.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    setAmountInput(formatted);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full sm:w-auto inline-flex items-center gap-2 p-3">
            <Plus className="h-4 w-4" />
            Nova Transação
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Ex: Supermercado, Salário..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                autoFocus
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={amountInput}
                onChange={handleAmountChange}
                required
                className="h-10"
              />
              <p className="text-xs text-gray-500">Digite o valor em reais.</p>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <CategorySelect
              value={categoryId}
              onChange={setCategoryId}
              label="Categoria"
              placeholder="Selecione a categoria"
              withCreate
            />

            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <div className="w-[220px]">
                <Input
                    id="date"
                    type="date"
                    value={date}
                    max={todayISO}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="h-9"
                  />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">Salvar Transação</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Toast toast={toast} onClose={hide} />
    </>
  );
}
