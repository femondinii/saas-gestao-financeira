import React from 'react';

export function Toast({ toast, onClose }) {
    if (!toast) return null;
        const isSuccess = toast.tone === 'success';
        const cls = isSuccess
        ? 'bg-green-50/90 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200'
        : 'bg-red-50/90 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200';

        return (
        <div role="status" className={`fixed bottom-6 right-6 max-w-sm rounded-xl shadow-lg px-4 py-3 border text-sm backdrop-blur-md ${cls}`}>
            <div className="font-semibold">{toast.title}</div>
            {toast.message && <div className="mt-1 opacity-90">{toast.message}</div>}
            <button onClick={onClose} className="absolute top-2 right-2 text-xs opacity-70 hover:opacity-100" aria-label="Fechar aviso">✕</button>
        </div>
    );
}