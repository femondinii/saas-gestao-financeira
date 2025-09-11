import React, {
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
  useMemo,
} from "react";
import { ChevronDown, Check } from "lucide-react";

const SelectContext = createContext();

const extractOptions = (children) => {
  const map = {};
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    const isSelectItem =
      child.type?.displayName === "SelectItem" || child.type?.__selectItem === true;

    if (isSelectItem) {
      const val = child.props.value;
      const labelFromProp = child.props.label;
      const labelFromChildren =
        typeof child.props.children === "string"
          ? child.props.children
          : String(child.props.children ?? "");
      const label = labelFromProp != null ? String(labelFromProp) : labelFromChildren;

      if (val != null) map[val] = label;
    }

    if (child.props && child.props.children) {
      Object.assign(map, extractOptions(child.props.children));
    }
  });
  return map;
}

export const Select = ({ value, onValueChange, children, className = "" }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const contentRef = useRef(null);

  const labelsMap = useMemo(() => extractOptions(children), [children]);
  const getLabelFor = (val) => (val in labelsMap ? labelsMap[val] : val ?? "");

  useEffect(() => {
    const onClickOutside = (e) => {
      if (
        open &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        contentRef.current &&
        !contentRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }

    const onKey = (e) => {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange,
        open,
        setOpen,
        triggerRef,
        contentRef,
        getLabelFor,
      }}
    >
      <div className={`relative inline-block w-full ${className}`}>{children}</div>
    </SelectContext.Provider>
  );
}

const useSelect = () => {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error("Select.* precisa estar dentro de <Select>");
  return ctx;
}

export const SelectTrigger = ({ placeholder = "Selecione...", className = "", children }) => {
  const { value, open, setOpen, triggerRef, getLabelFor } = useSelect();

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setOpen(!open)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      {children ?? (
        <span className={`truncate ${value ? "text-gray-900" : "text-gray-400"}`}>
          {value ? getLabelFor(value) : placeholder}
        </span>
      )}
      <ChevronDown
        className={`h-4 w-4 opacity-70 transition-transform ${open ? "rotate-180" : ""}`}
      />
    </button>
  );
}

export const SelectContent = ({ children, className = "" }) => {
  const { open, contentRef, triggerRef } = useSelect();
  if (!open) return null;

  const width = triggerRef.current?.offsetWidth || "auto";

  return (
    <div
      ref={contentRef}
      className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-md ${className}`}
      style={{ minWidth: width }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-1">{children}</div>
    </div>
  );
}

export function SelectItem({ value, children, className = "" }) {
  const { onValueChange, setOpen, value: current } = useSelect();
  const selected = current === value;

  return (
    <div
      role="option"
      aria-selected={selected}
      onClick={() => {
        onValueChange?.(value);
        setOpen(false);
      }}
      className={`relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm hover:bg-gray-100 ${className}`}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {selected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  );
}

export function SelectLabel({ children, className = "" }) {
  return <div className={`py-1.5 pl-8 pr-2 text-sm font-semibold ${className}`}>{children}</div>;
}

export function SelectSeparator({ className = "" }) {
  return <div className={`my-1 h-px bg-gray-200 ${className}`} />;
}

export function SelectValue({ placeholder = "Selecione..." }) {
  const { value, getLabelFor } = useSelect();

  if (!value) {
    return <span className="text-gray-400">{placeholder}</span>;
  }

  return <>{getLabelFor(value)}</>;
}
