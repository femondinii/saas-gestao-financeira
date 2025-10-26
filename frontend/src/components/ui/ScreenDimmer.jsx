import { createPortal } from "react-dom";

export function ScreenDimmer({ show }) {
    if (!show) return null;

    return createPortal(
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-[1px]" />,
        document.body
    );
}
