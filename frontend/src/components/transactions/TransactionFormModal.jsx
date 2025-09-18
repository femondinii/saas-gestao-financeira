import { useEffect, useMemo, useState } from "react";
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
import { CategorySelect } from "../categories/CategorySelect";

export function TransactionFormModal({
    open,
    onOpenChange,
    trigger = null,
    title,
    submitText,
    successMessage,
    initialValues = {},
    onSubmit
}) {
    const [description, setDescription] = useState(initialValues.description || "");
    const [amountInput, setAmountInput] = useState("");
    const [categoryId, setCategoryId] = useState(initialValues.categoryId || "");
    const [type, setType] = useState(initialValues.type || "");
    const [date, setDate] = useState(initialValues.date || "");

    const { toast, show, hide } = useToast();

    const todayISO = useMemo(() => {
        const now = new Date();
        const off = now.getTimezoneOffset();
        const local = new Date(now.getTime() - off * 60 * 1000);
        return local.toISOString().slice(0, 10);
    }, []);

    useEffect(() => {
        if (!open) return;
        const amt = initialValues.amount;

        if (amt != null && amountInput === "") {
            const n = typeof amt === "string" ? Number(amt) : Number(amt);
            if (Number.isFinite(n)) {
                setAmountInput(n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
            }
        }
        if (!initialValues.date && !date) setDate(todayISO);
    }, [open, initialValues, amountInput, date, todayISO]);

    useEffect(() => {
        if (!open) {
            setDescription(initialValues.description || "");
            setAmountInput("");
            setCategoryId(initialValues.categoryId || "");
            setType(initialValues.type || "");
            setDate(initialValues.date || "");
        }
    }, [open, initialValues]);

    const parseBRLToNumber = (str) => {
        if (typeof str !== "string") return NaN;
        const onlyDigits = str.replace(/\D/g, "");
        if (!onlyDigits) return NaN;
        return Number(onlyDigits) / 100;
    };

    const validateTransaction = ({ description, type, amountInput, date }) => {
        const amt = parseBRLToNumber(amountInput);
        if (!Number.isFinite(amt) || amt <= 0) return "Informe um valor válido maior que zero.";
        if (type !== "income" && type !== "expense") return "Selecione o tipo.";
        if (!date) return "Informe a data.";
        if (description && description.trim().length > 140) return "Descrição pode ter no máximo 140 caracteres.";
        return null;
    };

    const handleAmountChange = (e) => {
        let raw = e.target.value.replace(/\D/g, "");

        if (!raw) {
            setAmountInput("");
            return;
        }

        const float = parseFloat(raw) / 100;
        const formatted = float.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        setAmountInput(formatted);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validateTransaction({ description, type, amountInput, date });

        if (validationError) {
            show({ title: "Erro", message: validationError, tone: "error" });
            return;
        }

        const amt = parseBRLToNumber(amountInput);
        const payload = {
            type,
            category: categoryId || null,
            amount: amt.toFixed(2),
            date,
            description: (description || "").trim(),
        };

        try {
            await onSubmit?.(payload);
            show({ title: "Sucesso", message: successMessage, tone: "success" });
            onOpenChange?.(false);
        } catch (err) {
            const msg = err?.message || "Operação não concluída.";
            show({ title: "Erro", message: msg, tone: "error" });
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
                <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Input
                            id="description"
                            placeholder="Ex: Supermercado, Salário..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
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
                    <CategorySelect value={categoryId} onChange={setCategoryId} withCreate />
                    <div className="space-y-2">
                        <Label htmlFor="date">Data</Label>
                        <div className="w-[220px]">
                            <Input
                                id="date"
                                type="date"
                                value={date || ""}
                                max={todayISO}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                className="h-9"
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
