import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";

export function AlertModal({
    open,
    title,
    message,
    onConfirm,
    onCancel,
    danger = false,
}) {
    const cancelRef = useRef(null);

    useEffect(() => {
        cancelRef.current?.focus();
        const onKey = (e) => { if (e.key === "Escape") onCancel?.(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onCancel]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
                <div role="dialog" aria-modal="true" className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <p className="mt-2 text-sm text-gray-600">{message}</p>
                    <div className="mt-6 flex items-center justify-end gap-3">
                    <Button variant="outline" className="w-auto px-4" onClick={onCancel} ref={cancelRef}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        className={`w-auto px-4 ${danger ? "bg-rose-600 hover:bg-rose-700" : ""}`}
                        onClick={onConfirm}
                    >
                        Confirmar
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}
