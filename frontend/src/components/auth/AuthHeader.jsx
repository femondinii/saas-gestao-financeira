import React from "react";
import LogoIcon from "./LogoIcon";

export default function AuthHeader({ title, subtitle }) {
    return (
        <div className="text-center">
        <div className="mx-auto mb-6 w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <LogoIcon />
        </div>
        <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {title}
        </h1>
        {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {subtitle}
            </p>
        )}
        </div>
    );
}
