import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogClose, DialogFooter,
} from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/Select";
import { Toast } from "../ui/Toast";
import { useToast } from "../../hooks/useToast";
import { Plus } from "lucide-react";
import { validateWallet } from "../../utils/validators";
import { formatBRL, parseBRLToNumber } from "../../utils/formatters";

export function WalletFormModal({
  open,
  onOpenChange,
  title = "Nova Carteira",
  submitText = "Adicionar",
  successMessage = "Carteira criada com sucesso.",
  initialValues = {},
  onSubmit
}) {
  const { toast, show, hide } = useToast();

  const [name, setName] = useState(initialValues.name || "");
  const [kind, setKind] = useState(initialValues.kind || "checking");
  const [amountInput, setAmountInput] = useState("");
  const [color, setColor] = useState(initialValues.color || "#3B82F6");

  useEffect(() => {
    if (!open) {
      setName(initialValues.name || "");
      setKind(initialValues.kind || "checking");
      setAmountInput("");
      setColor(initialValues.color || "#3B82F6");
    }
  }, [open, initialValues]);

  const handleAmountChange = (e) => {
    let raw = (e.target.value ?? "").replace(/\D/g, "");
    if (!raw) {
      setAmountInput("");
      return;
    }
    const float = Number(raw) / 100;
    setAmountInput(formatBRL(float));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const err = validateWallet({ name, amountInput });
    if (err) {
      show({ title: "Erro", message: err, tone: "error" });
      return;
    }

    const hex = (color ?? "").toString().trim().toUpperCase();

    if (!/^#[0-9A-F]{6}$/.test(hex)) {
      show({ title: "Erro", message: "Selecione uma cor válida.", tone: "error" });
      return;
    }

    const numberInitial = parseBRLToNumber(amountInput);
    const payload = {
      name: name.trim(),
      kind,
      initial_balance: Number.isFinite(numberInitial) ? numberInitial.toFixed(2) : "0.00",
      color: hex,
    };

    try {
      await onSubmit?.(payload);
      show({ title: "Sucesso", message: successMessage, tone: "success" });
      onOpenChange?.(false);
    } catch (e2) {
      const msg = e2?.message || "Operação não concluída.";
      show({ title: "Erro", message: msg, tone: "error" });
    }
  };

  return (
    <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto inline-flex items-center gap-2 p-3">
                    <Plus className="h-4 w-4" />
                    Nova Carteira
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="wallet-name">Nome</Label>
                    <Input
                        id="wallet-name"
                        placeholder="Ex: Conta Corrente"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-10"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={kind} onValueChange={setKind}>
                        <SelectTrigger className="h-10 w-full">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                          <SelectContent>
                          <SelectItem value="checking">Conta corrente</SelectItem>
                          <SelectItem value="savings">Poupança</SelectItem>
                          <SelectItem value="cash">Dinheiro</SelectItem>
                          <SelectItem value="credit">Cartão de crédito</SelectItem>
                          <SelectItem value="investment">Investimento</SelectItem>
                          <SelectItem value="other">Outros</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="wallet-initial">Saldo inicial</Label>
                    <Input
                        id="wallet-initial"
                        inputMode="numeric"
                        placeholder="R$ 0,00"
                        value={amountInput ?? ""}
                        onChange={handleAmountChange}
                        className="h-10"
                    />
                <p className="text-xs text-gray-500">Digite o valor em reais (mínimo 0,00).</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="wallet-color">Cor</Label>
                    <div className="flex items-center gap-3">
                        <input
                            id="wallet-color"
                            type="color"
                            className="p-1 h-10 w-14 block bg-white border border-gray-200 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            title="Escolha a cor"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit">{submitText}</Button>
                </DialogFooter>
            </form>
            </DialogContent>
        </Dialog>
        <Toast toast={toast} onClose={hide} />
    </>
  );
}
