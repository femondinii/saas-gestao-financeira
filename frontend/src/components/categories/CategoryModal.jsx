import { useEffect, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { Button } from "../ui/Button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "../ui/Dialog";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Toast } from "../ui/Toast";
import { api } from "../../lib/api";
import { CategoryGrid } from "./CategoryGrid";
import { ScreenDimmer } from "../ui/ScreenDimmer";

export function CategoryModal({
    open,
    setOpen,
    onCreated,
    items,
    refetch,
    loading
}) {
    const [catName, setCatName] = useState("");
    const [saving, setSaving] = useState(false);
    const { toast, show, hide } = useToast();

    useEffect(() => {
        if (!open) setCatName("");
    }, [open]);

    async function handleCreate() {
        const name = catName.trim();

        if (!name) {
            show({
                title: "Erro",
                message: "Informe o nome da categoria",
                tone: "error",
            });
            return;
        }

        try {
            setSaving(true);
            const res = await api.post("/finance/categories/", { name });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                const detail =
                    data?.name?.[0] ||
                    data?.detail ||
                    "Não foi possível criar a categoria.";
                throw new Error(detail);
            }

            const data = await res.json().catch(() => ({}));
            const createdName = data?.name || name;

            show({
                title: "Categoria criada",
                message: `“${createdName}” adicionada.`,
                tone: "success",
            });

            onCreated?.(createdName);
            setOpen(false);
        } catch (err) {
            show({
                title: "Erro",
                message: err?.message || "Falha ao criar categoria.",
                tone: "error",
            });
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <ScreenDimmer show={open} />
            <Dialog
                open={open}
                onOpenChange={setOpen}
            >
                <DialogContent className="sm:max-w-[420px] z-[2000] shadow-2xl ring-1 ring-white/10">
                    <DialogHeader>
                        <DialogTitle>
                            Nova Categoria
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cat-name">
                                Nome
                            </Label>
                            <Input
                                id="cat-name"
                                placeholder="Ex.: Investimentos"
                                value={catName}
                                onChange={(e) => setCatName(e.target.value)}
                                autoFocus
                                className="h-10"
                                required
                            />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                >
                                    Cancelar
                                </Button>
                            </DialogClose>
                            <Button
                                type="button"
                                onClick={handleCreate}
                                disabled={saving}
                            >
                                {saving ? "Salvando..." : "Criar"}
                            </Button>
                        </DialogFooter>
                    </div>
                    <CategoryGrid
                        items={items}
                        refetch={refetch}
                        loading={loading}
                    />
                </DialogContent>
            </Dialog>
            <Toast
                toast={toast}
                onClose={hide}
            />
        </>
    );
}