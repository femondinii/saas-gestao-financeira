import React from 'react';

export function Card({ children, className = '' }) {
    return (
        <div className={`bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm ${className}`}>{children}</div>
    );
}

export function CardBody({ children, className = '' }) {
    return <div className={`p-8 ${className}`}>{children}</div>;
}