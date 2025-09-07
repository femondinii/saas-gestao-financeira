import React, { useState } from "react";
import AuthLayout from "../components/auth/AuthLayout.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Button } from "../components/ui/Button.jsx";
import FormError from "../components/ui/FormError.jsx";
import SocialOAuthRow from "../components/auth/SocialOAuthRow.jsx";
import { Toast } from "../components/ui/Toast.jsx";
import { useToast } from "../hooks/useToast.js";
import { api } from "../lib/api.js";
import { validateRegister } from "../utils/validators.js";

export default function RegisterPage() {
    const { toast, show, hide } = useToast();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        const v = validateRegister({ name, email, password });
        if (v) return setError(v);
        setLoading(true);

        try {
            const res = await api.post(
                "/auth/register/",
                { name, email, password, password_confirm: password },
                { withAuth: false }
            );

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                const detail =
                (data && (data.detail || data.email || data.non_field_errors)) ||
                "Falha ao cadastrar.";
                throw new Error(
                Array.isArray(detail) ? detail.join(" ") : String(detail)
                );
            }
            sessionStorage.setItem(
                "azul_logout_toast",
                "Conta criada com sucesso! Faça login."
            );
            window.location.assign("/login");
        } catch (err) {
            setError(err.message || "Erro ao conectar ao servidor.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout
            title="Blue Finance"
            subtitle="Crie uma conta para começar a gerenciar suas finanças"
        >
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <Input
                id="name"
                label="Nome"
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <Input
                id="email"
                label="Email"
                type="email"
                placeholder="exemplo@email.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <Input
                id="password"
                label="Senha"
                autoComplete="new-password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                isPassword
            />
            <FormError message={error} />
                <Button type="submit" disabled={loading}>
                    {loading ? "Cadastrando..." : "Cadastrar"}
                </Button>
            <SocialOAuthRow
                onGoogle={() =>
                    show({
                    title: "Em breve",
                    message: "Cadastro com Google ainda não está habilitado.",
                    tone: "error",
                    })
                }
            />
        </form>

        <p className="text-center text-sm mt-6 text-gray-600 dark:text-gray-400">
            Já tem uma conta?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
            Entre
            </a>
        </p>
        <footer className="mt-10 text-center text-xs text-gray-400">
            Blue Finance © 2025 – App de Gerenciamento Financeiro Pessoal
        </footer>
        <Toast toast={toast} onClose={hide} />
        </AuthLayout>
    );
}
