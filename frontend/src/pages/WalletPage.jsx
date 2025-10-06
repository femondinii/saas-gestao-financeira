import React, { useEffect, useState } from "react";
import TitlePage from "../components/layout/TitlePage";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from "../components/ui/Card.jsx";
import { Wallet as WalletIcon, TrendingUp, Trash2 } from "lucide-react";
import { api } from "../lib/api.js";
import { WalletFormModal } from "../components/wallets/WalletFormModal.jsx";
import { formatBRL } from "../utils/formatters.js";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { AlertModal } from "../components/ui/AlertModal.jsx";
import { Badge } from "../components/ui/Badge.jsx";

export default function WalletPage() {
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [archiving, setArchiving] = useState(false);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        reload();
    }, []);

    const reload = async () => {
        setLoading(true);

        try {
            const res = await api.get("/finance/wallets/total-balance/");

            if (!res.ok) {
                throw new Error("Falha ao carregar carteiras.");
            }

            const data = await res.json();
            const walletsData = Array.isArray(data?.wallets) ? data.wallets : [];

            setWallets(walletsData);
            setTotal(Number(data?.total_balance || 0));
        } catch (_) {
        } finally {
            setLoading(false);
        }
    }

    const handleCreate = async (payload) => {
        const res = await api.post("/finance/wallets/", payload);

        if (!res.ok) {
            const data = await res.json().catch(() => null);
            const detail =
                (data && (data.detail || data.name || data.non_field_errors)) ||
                "Falha ao criar carteira.";
            throw new Error(Array.isArray(detail) ? detail.join(" ") : String(detail));
        }
        await reload();
    }

    const openArchiveConfirm = (wallet) => {
        setSelectedWallet(wallet);
        setConfirmOpen(true);
    }

    const confirmArchive = async () => {
        if (!selectedWallet) return;

        setArchiving(true);
        try {
            const res = await api.post(`/finance/wallets/${selectedWallet.id}/archive/`, {});

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                const msg = (data && data.detail) || "Não foi possível arquivar a carteira.";
                throw new Error(msg);
            }

            setConfirmOpen(false);
            setSelectedWallet(null);
            await reload();
        } catch (e) {
            setConfirmOpen(false);
            setSelectedWallet(null);
        } finally {
            setArchiving(false);
        }
    }

    const kindEnum = {
        cash: "Dinheiro",
        savings: "Poupança",
        credit: "Cartão de Crédito",
        checking: "Conta Corrente",
        other: "Outros"
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <TitlePage title="Carteiras" subtitle="Visão geral das suas carteiras" />
                <WalletFormModal
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    onSubmit={handleCreate}
                    title="Nova Carteira"
                    submitText="Adicionar"
                    successMessage="Carteira criada com sucesso."
                />
            </div>
            <Card className="card-hover border-blue-200 dark:border-blue-900/40">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                        <TrendingUp className="h-5 w-5" />
                        Saldo Total
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl md:text-4xl font-bold">
                        {formatBRL(total)}
                    </p>
                    <p className="mt-2 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        {wallets.length} {wallets.length === 1 ? "carteira" : "carteiras"}
                    </p>
                </CardContent>
            </Card>
            {loading ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-36 rounded-xl bg-gray-100 dark:bg-neutral-900 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {wallets.map((w) => (
                        <Card key={w.id} className="card-hover overflow-hidden flex flex-col">
                            <div className="h-5" style={{ backgroundColor: w.color || "#3B82F6" }} />
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center justify-between gap-2 text-base md:text-lg">
                                    <span className="inline-flex items-center gap-2">
                                        <WalletIcon className="h-4 w-4 md:h-5 md:w-5" />
                                        {w.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => openArchiveConfirm(w)}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800"
                                        aria-label="Arquivar carteira"
                                        title="Arquivar"
                                    >
                                        <Trash2 className="h-4 w-4 text-rose-600" />
                                    </button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-3">
                                    <Badge tone="neutral">
                                        {kindEnum[w.kind]}
                                    </Badge>
                                </div>
                                <p className="text-xl md:text-2xl font-bold">
                                    {formatBRL(Number(w.current_balance ?? 0))}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                    {wallets.length === 0 && (
                        <div className="col-span-full">
                            <EmptyState variant="wallets" />
                        </div>
                    )}
                </div>
            )}
            <AlertModal
                open={confirmOpen}
                title="Deletar carteira"
                message={`Tem certeza que deseja deletar a carteira “${selectedWallet?.name}”?`}
                onCancel={() => { if (!archiving) setConfirmOpen(false); }}
                onConfirm={confirmArchive}
                danger
            />
        </div>
    );
}
