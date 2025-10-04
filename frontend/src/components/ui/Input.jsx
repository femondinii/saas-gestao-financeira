import React, { useState, useMemo } from 'react';
import { Eye, EyeOff } from "lucide-react";

export function Input({
    label,
    id,
    className = '',
    isPassword = false,
    startIcon = null,
    ...props
}) {
    const [show, setShow] = useState(false);

    const withLeftPadding = !!startIcon;
    const withRightPadding = isPassword;

    const computedInputClass = useMemo(() => {
        const left = withLeftPadding ? 'pl-9' : '';
        const right = withRightPadding ? 'pr-10' : '';

        return [
            "w-full rounded-lg border border-gray-300 dark:border-neutral-700",
            "bg-white dark:bg-neutral-900 px-3 py-2 outline-none",
            "focus:ring-2 focus:ring-blue-500",
            left,
            right,
        ].join(' ');
    }, [withLeftPadding, withRightPadding]);

    return (
        <div className={className}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                {startIcon && (
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                        {startIcon}
                    </span>
                )}

                <input
                    id={id}
                    type={isPassword ? (show ? 'text' : 'password') : (props.type || 'text')}
                    className={computedInputClass}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShow(s => !s)}
                        className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        aria-label={show ? 'Esconder senha' : 'Mostrar senha'}
                    >
                        {show ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                )}
            </div>
        </div>
    );
}

export function InputDate({
    value,
    onChange,
    min,
    max,
    ...props
}) {
    return (
        <input
            type="date"
            value={value || ""}
            min={min}
            max={max}
            onChange={(e) => onChange?.(e.target.value)}
            className={`h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed`}
            {...props}
        />
    );
}

export function InputCheckbox({
    id,
    checked,
    onChange,
    ariaLabel
}) {
    return (
        <label htmlFor={id} className={`inline-flex items-center relative `}>
        <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            aria-label={ariaLabel}
            className={`peer h-4 w-4 cursor-pointer transition-all appearance-none rounded border border-slate-300 shadow hover:shadow-md checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-500`}
        />
        <span className="pointer-events-none absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
        </span>
        </label>
    );
}