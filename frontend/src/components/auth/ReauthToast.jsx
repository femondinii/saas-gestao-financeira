import { createPortal } from "react-dom";
import { AlertCircle } from "lucide-react";

export function ReauthToast({ show, onDismiss }) {
    if (!show) return null;

    const handleLogin = () => {
        localStorage.removeItem("access_token");
        window.location.href = '/login';
        window.__authRequiredShown = false;
    };

    const node = (
        <div
            role="alert"
            aria-live="assertive"
            className="fixed bottom-6 right-6 z-[99999] max-w-sm rounded-xl shadow-lg px-4 py-3 border backdrop-blur-md bg-orange-50/90 border-orange-200 text-orange-800 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-200"
        >
            <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">Sessão Expirada</div>
                    <div className="mt-1 text-sm opacity-90">
                        Sua sessão expirou. Faça login novamente para continuar.
                    </div>
                    <button
                        onClick={handleLogin}
                        className="mt-2 text-sm font-medium underline hover:no-underline"
                    >
                        Fazer Login
                    </button>
                </div>
                <button
                    onClick={onDismiss}
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