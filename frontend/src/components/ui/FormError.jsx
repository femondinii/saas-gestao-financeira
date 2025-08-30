import React from "react";

export default function FormError({ message }) {
    if (!message) return null;

    return (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 p-3 rounded-md">
        {message}
        </div>
    );
}
