import React, { useState } from 'react';
import { Eye, EyeOff } from "lucide-react";

export function Input({
    label,
    id,
    hint,
    className = '',
    isPassword = false,
    ...props
}) {
    const [show, setShow] = useState(false);

    return (
        <div className={className}>
        {label && (
            <label
            htmlFor={id}
            className="block text-sm font-medium mb-1"
            >
            {label}
            </label>
        )}

        <div className="relative">
            <input
            id={id}
            type={isPassword ? (show ? 'text' : 'password') : (props.type || 'text')}
            className="w-full rounded-lg border border-gray-300 dark:border-neutral-700
                        bg-white dark:bg-neutral-900 px-3 py-2 pr-10
                        outline-none focus:ring-2 focus:ring-blue-500"
            {...props}
            />

            {isPassword && (
            <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700
                        dark:hover:text-gray-300"
                aria-label={show ? 'Esconder senha' : 'Mostrar senha'}
            >
                {show ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            )}
        </div>

        {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
    );
}
