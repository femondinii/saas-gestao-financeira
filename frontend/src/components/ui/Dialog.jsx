import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useId,
    useMemo,
    useState,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const DialogCtx = createContext(null);

export const Dialog = ({
  open: openProp,
  onOpenChange,
  defaultOpen = false,
  children,
  className = "",
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = typeof openProp === "boolean";
  const open = isControlled ? openProp : uncontrolledOpen;

  const setOpen = useCallback(
    (v) => {
      if (!isControlled) setUncontrolledOpen(v);
      onOpenChange?.(v);
    },
    [isControlled, onOpenChange]
  );

  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const value = useMemo(
    () => ({ open, setOpen, titleId, descId }),
    [open, setOpen, titleId, descId]
  );

  return (
    <DialogCtx.Provider value={value}>
      <div className={className}>{children}</div>
    </DialogCtx.Provider>
  );
}

const useDialog = () => {
  const ctx = useContext(DialogCtx);
  if (!ctx) throw new Error("Dialog.* deve ser usado dentro de <Dialog>");
  return ctx;
}

export const DialogTrigger = ({ asChild, children, className = "", ...props }) => {
  const { setOpen } = useDialog();
  const handleClick = () => setOpen(true);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        handleClick();
      },
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm hover:bg-gray-100 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export const DialogOverlay = ({ className = "", onClick, ...props }) => {
  const { open, setOpen } = useDialog();

  if (!open) return null;

  const node = (
    <div
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm ${className}`}
      {...props}
    />
  );
  return createPortal(node, document.body);
}

export const DialogContent = ({ children, className = "", ...props }) => {
  const { open, titleId, descId } = useDialog();
  if (!open) return null;

  const node = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onClick={(e) => e.stopPropagation()}
      className={`fixed left-1/2 top-1/2 z-[60] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white p-6 shadow-lg ${className}`}
      {...props}
    >
      {children}
      <DialogClose className="absolute right-4 top-4" aria-label="Fechar" />
    </div>
  );

  return createPortal(
    <>
      <DialogOverlay />
      {node}
    </>,
    document.body
  );
}

export const DialogClose = ({ asChild, children, className = "", ...props }) => {
  const { setOpen } = useDialog();
  const onClick = () => setOpen(false);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        onClick();
      },
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 ${className}`}
      {...props}
    >
      {children ?? <X className="h-4 w-4" />}
      <span className="sr-only">Fechar</span>
    </button>
  );
}

export const DialogHeader = ({ children, className = "" }) => {
  return <div className={`mb-3 flex flex-col space-y-1.5 text-left ${className}`}>{children}</div>;
}

export const DialogFooter = ({ children, className = "" }) => {
  return (
    <div className={`mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end ${className}`}>
      {children}
    </div>
  );
}

export const DialogTitle = ({ children, className = "" }) => {
  const { titleId } = useDialog();
  return (
    <h3 id={titleId} className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
      {children}
    </h3>
  );
}

export const DialogDescription = ({ children, className = "" }) => {
  const { descId } = useDialog();
  return (
    <p id={descId} className={`text-sm text-gray-500 ${className}`}>
      {children}
    </p>
  );
}
