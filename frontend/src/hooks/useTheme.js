import { useEffect, useState } from "react";

export function useTheme() {
    const [theme, setTheme] = useState(() =>
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark")
        ? "dark"
        : "light"
    );

    useEffect(() => {
        const saved = localStorage.getItem("theme");

        if (saved) {
            document.documentElement.classList.toggle("dark", saved === "dark");
            setTheme(saved);
        }
    }, []);

    const toggle = () => {
        const isDark = document.documentElement.classList.toggle("dark");
        const next = isDark ? "dark" : "light";
        localStorage.setItem("theme", next);
        setTheme(next);
    };

    return { theme, toggle };
}
