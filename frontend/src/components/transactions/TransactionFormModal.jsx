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
import { validateTransaction } from "../../utils/validators";
import { parseBRLToNumber } from "../../utils/formatters";
import { WalletSelect } from "../wallets/WalletSelect";
import { api } from "../../lib/api";

export function TransactionFormModal({
	open,
	onOpenChange,
	trigger = null,
	title,
	submitText,
	successMessage,
	initialValues = {},
	onSubmit,
	onSuccess,
}) {
	const [description, setDescription] = useState(initialValues.description || "");
	const [amountInput, setAmountInput] = useState("");
	const [categoryId, setCategoryId] = useState(initialValues.categoryId || "");
	const [type, setType] = useState(initialValues.type || "");
	const [date, setDate] = useState(initialValues.date || "");
	const [walletId, setWalletId] = useState(initialValues.walletId || "");
	const [originWalletId, setOriginWalletId] = useState("");

	const [wallets, setWallets] = useState([]);
	const [loadingWallets, setLoadingWallets] = useState(false);

	const { toast, show, hide } = useToast();

	const getTodayISO = useMemo(() => {
		const now = new Date();
		const off = now.getTimezoneOffset();
		const local = new Date(now.getTime() - off * 60 * 1000);
		return local.toISOString().slice(0, 10);
	}, []);

	useEffect(() => {
		if (!open) return;

		(async () => {
			setLoadingWallets(true);
			try {
				const res = await api.get("/finance/wallets/?is_archived=false");
				const data = await res.json().catch(() => ({}));
				const list = Array.isArray(data) ? data : (data.results ?? []);
				setWallets(list);
			} finally {
				setLoadingWallets(false);
			}
		})();
	}, [open]);

	const selectedWallet = useMemo(
		() => wallets.find(w => String(w.id) === String(walletId)),
		[wallets, walletId]
	);

	const isCreditPayment = selectedWallet?.kind === "credit" && type === "income";

	useEffect(() => {
		if (!open) return;
		const amt = initialValues.amount;
		if (amt != null && amountInput === "") {
			const n = Number(amt);
			if (Number.isFinite(n)) {
				setAmountInput(n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
			}
		}
		if (!initialValues.date && !date) setDate(getTodayISO);
	}, [open, initialValues, amountInput, date, getTodayISO]);

	useEffect(() => {
		if (!open) {
			setDescription(initialValues.description || "");
			setAmountInput("");
			setCategoryId(initialValues.categoryId || "");
			setType(initialValues.type || "");
			setDate(initialValues.date || "");
			setWalletId(initialValues.walletId || "");
			setOriginWalletId("");
		}
	}, [open, initialValues]);

	useEffect(() => {
		if (isCreditPayment && categoryId) setCategoryId("");
	}, [isCreditPayment, categoryId]);

	const handleAmountChange = (e) => {
		let raw = (e.target.value || "").replace(/\D/g, "");
		if (!raw) {
			setAmountInput("");
			return;
		}
		const float = parseFloat(raw) / 100;
		setAmountInput(float.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const validationError = validateTransaction({ description, type, amountInput, date });

		if (validationError) {
			show({ title: "Erro", message: validationError, tone: "error" });
			return;
		}

		if (!walletId) {
			show({ title: "Erro", message: "Selecione a carteira.", tone: "error" });
			return;
		}

		if (isCreditPayment) {
			if (!originWalletId) {
				show({ title: "Erro", message: "Selecione a carteira de origem do pagamento.", tone: "error" });
				return;
			}

			if (String(originWalletId) === String(walletId)) {
				show({ title: "Erro", message: "Origem e destino devem ser carteiras diferentes.", tone: "error" });
				return;
			}
		}

		const amt = parseBRLToNumber(amountInput);

		try {
			if (isCreditPayment) {
				const res = await api.post("/finance/transactions/transfer/", {
					from_wallet_id: originWalletId,
					to_wallet_id: walletId,
					amount: amt,
					date: date,
					description: description || "Pagamento da fatura",
				});

				if (!res.ok) {
					const data = await res.json().catch(() => null);
					const detail =
						(data && (data.detail || data.non_field_errors)) ||
						"Falha ao registrar a transferência.";
					throw new Error(Array.isArray(detail) ? detail.join(" ") : String(detail));
				}
				await onSuccess?.();
			} else {
				const payload = {
					type,
					category: categoryId || null,
					amount: amt.toFixed(2),
					date: date,
					description: (description || "").trim(),
					wallet: walletId || null,
				};
				await onSubmit?.(payload);
			}

			show({ title: "Sucesso", message: isCreditPayment ? "Pagamento registrado" : successMessage, tone: "success" });
			onOpenChange?.(false);
		} catch (err) {
			const msg = err?.message || "Operação não concluída";
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
								placeholder={"Ex: Supermercado, Salário..."}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								className="h-10"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="amount">{"Valor"}</Label>
							<Input
								id="amount"
								inputMode="numeric"
								placeholder={"R$ 0,00"}
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
									<SelectItem value="income">
										{selectedWallet?.kind === "credit" ? "Pagamento da fatura" : "Receita"}
									</SelectItem>
									<SelectItem value="expense">Despesa</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<WalletSelect
							value={walletId}
							onChange={setWalletId}
							placeholder={loadingWallets ? "Carregando..." : "Selecione a carteira"}
                            label="Carteira"
                            withCreate
						/>
						{isCreditPayment && (
							<div className="space-y-1">
								<WalletSelect
									label="Carteira de origem"
									value={originWalletId}
									onChange={setOriginWalletId}
									placeholder="Selecione a carteira de origem"
                                    withCreate
								/>
								<p className="text-xs text-gray-500">De onde o dinheiro sai</p>
							</div>
						)}
						{!isCreditPayment && (
							<CategorySelect
								value={categoryId}
								onChange={setCategoryId}
								withCreate
							/>
						)}

						<div className="space-y-2">
							<Label htmlFor="date">Data</Label>
							<div className="w-[220px]">
								<Input
									id="date"
									type="date"
									value={date || ""}
									max={getTodayISO}
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
							<Button type="submit">{isCreditPayment ? "Registrar pagamento" : submitText}</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
			<Toast toast={toast} onClose={hide} />
		</>
	);
}
