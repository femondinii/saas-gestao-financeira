import React from 'react';

export function Spinner({ size = 'md', className = '', text = '' }) {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12'
    };

    const spinnerSize = sizes[size] || sizes.md;

    return (
        <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
            <div
                className={`${spinnerSize} animate-spin rounded-full border-2 border-gray-200 border-t-blue-600 dark:border-neutral-700 dark:border-t-blue-400`}
                role="status"
                aria-label="Carregando"
            />
            {text && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
            )}
        </div>
    );
}

export function SpinnerInline({ size = 'sm', className = '' }) {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6'
    };

    const spinnerSize = sizes[size] || sizes.sm;

    return (
        <div
            className={`${spinnerSize} animate-spin rounded-full border-2 border-gray-200 border-t-blue-600 dark:border-neutral-700 dark:border-t-blue-400 ${className}`}
            role="status"
            aria-label="Carregando"
        />
    );
}

export function LoadingOverlay({ text = 'Carregando...' }) {
    return (
        <div className="flex items-center justify-center py-8">
            <Spinner size="lg" text={text} />
        </div>
    );
}