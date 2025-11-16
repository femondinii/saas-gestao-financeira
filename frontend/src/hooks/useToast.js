import { useCallback, useEffect, useState } from 'react';

export function useToast(autoHideMs = 3500) {
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (!toast) {
            return;
        }

        const t = setTimeout(() => setToast(null), autoHideMs);

        return () => clearTimeout(t);
    }, [toast, autoHideMs]);

    const show = useCallback((t) => setToast(t), []);
    const hide = useCallback(() => setToast(null), []);

    return { toast, show, hide };
}