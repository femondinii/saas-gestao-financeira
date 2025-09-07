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
import { useToast } from "../../hooks/useToast";
import { Plus } from "lucide-react";

const categories = [
  "Alimentação",
  "Moradia",
  "Transporte",
  "Saúde",
  "Entretenimento",
  "Educação",
  "Renda",
  "Renda Extra",
  "Presentes",
];

export function NewTransactionModal({ onTransactionCreated }) {
  const [open, setOpen] = useState(false);

  const [description, setDescription] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [date, setDate] = useState("");

  const { toast } = useToast();

  const todayISO = useMemo(() => {
    const now = new Date();
    const off = now.getTimezoneOffset();
    const local = new Date(now.getTime() - off * 60 * 1000);
    return local.toISOString().slice(0, 10);
  }, []);

  function normalizeAmount(str) {
    if (typeof str !== "string") return NaN;
    const s = str.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function resetForm() {
    setDescription("");
    setAmountInput("");
    setCategory("");
    setType("");
    setDate("");
  }

  function handleSubmit(e) {
    e.preventDefault();

    const amt = normalizeAmount(amountInput);
    if (
      !description ||
      !category ||
      !type ||
      !date ||
      !Number.isFinite(amt) ||
      amt <= 0
    ) {
      toast({
        title: "Erro",
        description:
          !Number.isFinite(amt) || amt <= 0
            ? "Informe um valor válido maior que zero."
            : "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    const signed = type === "despesa" ? -Math.abs(amt) : Math.abs(amt);

    const newTransaction = {
      id: Date.now(),
      description: description.trim(),
      amount: signed,
      category,
      type,
      date: new Date(date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };

    onTransactionCreated?.(newTransaction);

    toast({
      title: "Sucesso",
      description: "Transação criada com sucesso!",
    });

    resetForm();
    setOpen(false);
  }

  return (
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
          {/* Descrição */}
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

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input
              id="amount"
              inputMode="decimal"
              placeholder="0,00"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              required
              className="h-10"
            />
            <p className="text-xs text-gray-500">
              Use vírgula ou ponto para decimais (ex.: 100,50).
            </p>
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data */}
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

          {/* Ações */}
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
  );
}
