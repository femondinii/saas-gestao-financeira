import React from "react";

export function Badge({ children, tone="default" }) {
    const map = {
        default: "bg-gray-100 text-gray-700",
        neutral: "bg-blue-100 text-blue-700"
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[tone]}`}>
            {children}
        </span>
    );
}
