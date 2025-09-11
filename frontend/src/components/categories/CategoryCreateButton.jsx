import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Toast } from "../ui/Toast";
import { useToast } from "../../hooks/useToast";
import { api } from "../../lib/api.js";

export function CategoryCreateButton({ onCreated, className = "ml-auto" }) {
  const [open, setOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast, show, hide } = useToast();

  useEffect(() => {
    if (!open) setCatName("");
  }, [open]);

  async function handleCreate() {
    const name = catName.trim();
    if (!name) return;

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-sm text-blue-600 hover:underline font-medium ${className}`}
      >
        Nova
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nome da categoria</Label>
              <Input
                id="cat-name"
                placeholder="Ex.: Investimentos"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                autoFocus
                className="h-10"
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>

              <Button type="button" onClick={handleCreate} disabled={saving}>
                {saving ? "Salvando..." : "Criar"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Toast toast={toast} onClose={hide} />
    </>
  );
}
