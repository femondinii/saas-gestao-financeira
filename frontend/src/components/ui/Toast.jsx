import { createPortal } from "react-dom";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

export function Toast({ toast, onClose }) {
    if (!toast) return null;

    const variants = {
        success: {
            bg: "bg-green-50/90 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200",
            icon: CheckCircle,
        },
        error: {
            bg: "bg-red-50/90 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200",
            icon: XCircle,
        },
        warning: {
            bg: "bg-orange-50/90 border-orange-200 text-orange-800 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-200",
            icon: AlertCircle,
        },
        info: {
            bg: "bg-blue-50/90 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200",
            icon: Info,
        },
    };

    const variant = variants[toast.tone] || variants.info;
    const Icon = variant.icon;

    const node = (
        <div
            role="status"
            aria-live="polite"
            className={`fixed bottom-6 right-6 z-[99999] max-w-sm rounded-xl shadow-lg px-4 py-3 border backdrop-blur-md ${variant.bg}`}
        >
            <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    {toast.title && (
                        <div className="font-semibold text-sm">{toast.title}</div>
                    )}
                    {toast.message && (
                        <div className="mt-1 text-sm opacity-90">{toast.message}</div>
                    )}
                    {toast.action && (
                        <button
                            onClick={toast.action.onClick}
                            className="mt-2 text-sm font-medium underline hover:no-underline"
                        >
                            {toast.action.label}
                        </button>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="shrink-0 ml-2 opacity-70 hover:opacity-100 transition-opacity"
                    aria-label="Fechar aviso"
                    type="button"
                >
                    ✕
                </button>
            </div>
        </div>
    );

    return createPortal(node, document.body);
}