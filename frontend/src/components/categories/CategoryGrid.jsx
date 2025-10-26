import { useState } from "react";
import { Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { AlertModal } from "../ui/AlertModal";
import { IconButton } from "../ui/Button";
import { useToast } from "../../hooks/useToast";
import { Toast } from "../ui/Toast";
import { EmptyState } from "../ui/EmptyState";
import { LoadingOverlay } from "../ui/Spinner";

export function CategoryGrid({ items, refetch, loading }) {
	const [open, setOpen] = useState(false);
	const [selected, setSelected] = useState(null);
    const { toast, show, hide } = useToast();

	const categories = items.filter((cat) => !cat.is_system);

	const handleDelete = async () => {
        if (!selected) return;

        try {
			const res = await api.post(`/finance/categories/${selected.id}/archive/`, {});

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                const detail =
                    data?.name?.[0] ||
                    data?.detail ||
                    "Não foi possível deletar a categoria.";

                throw new Error(detail);
            }

            show({
                tone: "success",
                title: "Categoria deletada",
                message: `“${selected.name}” foi deletada com sucesso.`,
            });
            refetch?.();
		} catch (err) {
            show({
                tone: "error",
                title: "Erro ao deletar",
                message: err?.message
            });
		} finally {
			setSelected(null);
			setOpen(false);
		}
	};

    if (loading) {
        return (
            <LoadingOverlay />
        );
    }

	return (
		<>
            <div className="pt-5">
                <div className="h-50 overflow-auto">
                    {categories.length === 0 && !loading ? (
                        <EmptyState variant="categories" />
                    ) : (
                        <div className="rounded-lg border border-gray-200 shadow-sm">
                            <table className="w-full table-auto">
                                <tbody>
                                    {categories.map((cat) => (
                                        <tr key={cat.id} className="border-t">
                                            <td className="px-4 py-2 text-sm text-gray-800">{cat.name}</td>
                                            <td className="px-4 py-2 text-right">
                                                <IconButton
                                                    icon={Trash2}
                                                    onClick={() => {
                                                        setSelected(cat);
                                                        setOpen(true);
                                                    }}
                                                    className="text-rose-600 hover:text-rose-700"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <AlertModal
                        open={open}
                        title="Deletar categoria"
                        message={`Tem certeza que deseja deletar a categoria "${selected?.name}"? Essa ação não poderá ser desfeita.`}
                        onCancel={() => {
                            setOpen(false);
                            setSelected(null);
                        }}
                        onConfirm={handleDelete}
                        danger
                    />
                </div>
            </div>
            <Toast
                toast={toast}
                onClose={hide}
            />
        </>
	);
}