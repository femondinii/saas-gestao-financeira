import React from 'react';

export function Button({ children, className = '', variant = 'primary', ...props }) {
    const base = 'h-11 w-full rounded-lg font-medium transition disabled:opacity-60';
    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        outline: 'border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800',
        ghost: 'hover:bg-gray-100 dark:hover:bg-neutral-800',
    };

    return (
        <button className={`${base} ${variants[variant] || ''} ${className}`} {...props}>{children}</button>
    );
}