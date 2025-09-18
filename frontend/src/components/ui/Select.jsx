import React, {
  useState, useRef, useEffect, useContext, useMemo, createContext,
} from "react";
import { ChevronDown, Check } from "lucide-react";

const SelectContext = createContext(null);

const collectItemLabels = (children, map = {}) => {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const t = child.type;
    if (t && t.displayName === "SelectItem") {
      const v = child.props.value;
      const label = typeof child.props.children === "string"
        ? child.props.children
        : String(child.props.children);
      if (v != null) map[String(v)] = label;
    }
    if (child.props?.children) collectItemLabels(child.props.children, map);
  });
  return map;
}

export const Select = ({ value, onValueChange, children, className = "" }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const contentRef = useRef(null);

  const labelsMap = useMemo(() => collectItemLabels(children), [children]);
  const getLabelFor = (v) => (v != null ? (labelsMap[String(v)] ?? String(v)) : "");

  useEffect(() => {
    const onClickOutside = (e) => {
      if (
        open &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        contentRef.current &&
        !contentRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, triggerRef, contentRef, getLabelFor }}>
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
      <span className={`truncate ${value ? "text-gray-900" : "text-gray-400"}`}>
        {children ?? (value ? getLabelFor(value) : placeholder)}
      </span>
      <ChevronDown className={`h-4 w-4 opacity-70 transition-transform ${open ? "rotate-180" : ""}`} />
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

export const SelectItem = ({ value, children, className = "" }) => {
  const { onValueChange, setOpen, value: current } = useSelect();
  const selected = String(current) === String(value);

  return (
    <div
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
SelectItem.displayName = "SelectItem";

export function SelectLabel({ children, className = "" }) {
  return <div className={`py-1.5 pl-8 pr-2 text-sm font-semibold ${className}`}>{children}</div>;
}

export function SelectSeparator({ className = "" }) {
  return <div className={`my-1 h-px bg-gray-200 ${className}`} />;
}

export function SelectValue({ placeholder = "Selecione..." }) {
  const { value, getLabelFor } = useSelect();
  return value ? <>{getLabelFor(value)}</> : <span className="text-gray-400">{placeholder}</span>;
}
