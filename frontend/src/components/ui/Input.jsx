import React, { useState, useMemo } from 'react';
import { Eye, EyeOff } from "lucide-react";

export function Input({
    label,
    id,
    hint,
    className = '',
    inputClassName = '',
    isPassword = false,
    startIcon = null,
    endIcon = null,
    ...props
}) {
    const [show, setShow] = useState(false);

    const withLeftPadding = !!startIcon;
    const withRightPadding = isPassword || !!endIcon;

    const computedInputClass = useMemo(() => {
        const left = withLeftPadding ? 'pl-9' : '';
        const right = withRightPadding ? 'pr-10' : '';
        return [
            "w-full rounded-lg border border-gray-300 dark:border-neutral-700",
            "bg-white dark:bg-neutral-900 px-3 py-2 outline-none",
            "focus:ring-2 focus:ring-blue-500",
            left,
            right,
            inputClassName || ''
        ].join(' ');
    }, [withLeftPadding, withRightPadding, inputClassName]);

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
                {isPassword ? (
                    <button
                        type="button"
                        onClick={() => setShow(s => !s)}
                        className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        aria-label={show ? 'Esconder senha' : 'Mostrar senha'}
                    >
                        {show ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                ) : (
                endIcon && (
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                    {endIcon}
                    </span>
                )
                )}
            </div>
            {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
    );
}
