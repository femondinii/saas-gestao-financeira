import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
    BarChart3,
    CreditCard,
    Home,
    Menu,
    Sparkles,
    X,
    LogOut,
    Wallet,
    Settings
} from "lucide-react";
import { api } from "../../lib/api";

export function Sidebar({ className = "" }) {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();

    const navigationItems = [
        { name: "Dashboard", icon: Home, path: "/" },
        { name: "Transações", icon: CreditCard, path: "/transactions" },
        { name: "Carteiras", icon: Wallet, path: "/wallets" },
        { name: "Planejamento IA", icon: Sparkles, path: "/ai-planning" }
    ];

    const base = "flex h-screen flex-col border-r bg-white dark:bg-neutral-950 text-gray-800 dark:text-gray-100 transition-all duration-300";
    const width = collapsed ? "w-[70px]" : "w-[250px]";
    const itemBase = "flex items-center gap-3 rounded-md px-3 py-2 transition-colors";
    const itemActive = "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
    const itemIdle = "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-900/60";

    async function handleLogout() {
        try {
            await api.post("/accounts/auth/logout/", null, { withAuth: false });
        } catch (_) {}
        localStorage.removeItem("access_token");
        sessionStorage.setItem("azul_logout_toast", "Sessão encerrada com segurança.");
        navigate("/login", { replace: true });
    }

    return (
        <aside className={`${base} ${width} ${className}`}>
            <div className="flex h-16 items-center justify-between border-b px-3">
                {!collapsed && (
                    <Link to="/" className="flex items-center gap-2">
                        <div className="rounded-md bg-blue-500 p-1 text-white">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-blue-700 dark:text-blue-300">
                            Blue Finance
                        </span>
                    </Link>
                )}
                <button
                    type="button"
                    onClick={() => setCollapsed((v) => !v)}
                    className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-neutral-900/60"
                    aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
                    title={collapsed ? "Expandir" : "Colapsar"}
                >
                    {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
                </button>
            </div>
            <div className="flex flex-1 flex-col justify-between py-4">
                <nav className="space-y-1 px-2">
                    {navigationItems.map(({ name, icon: Icon, path }) => (
                        <NavLink
                            key={name}
                            to={path}
                            className={({ isActive }) =>
                                `${itemBase} ${isActive ? itemActive : itemIdle}`
                            }
                            title={collapsed ? name : undefined}
                        >
                            <Icon className="h-5 w-5 shrink-0" />
                            {!collapsed && <span className="truncate">{name}</span>}
                        </NavLink>
                    ))}
                </nav>
                <div className="px-2 space-y-1">
                    <button
                        type="button"
                        onClick={() => navigate("/settings")}
                        className={`${itemBase} ${itemIdle} w-full`}
                        title={collapsed ? "Configurações" : undefined}
                    >
                        <Settings className="h-5 w-5 shrink-0" />
                        {!collapsed && <span className="truncate">Configurações</span>}
                    </button>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className={`${itemBase} ${itemIdle} w-full text-red-600`}
                        title={collapsed ? "Sair" : undefined}
                    >
                        <LogOut className="h-5 w-5 shrink-0" />
                        {!collapsed && <span className="truncate">Sair</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
