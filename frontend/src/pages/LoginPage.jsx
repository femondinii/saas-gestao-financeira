import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Button } from "../components/ui/Button.jsx";
import FormError from "../components/ui/FormError.jsx";
import SocialOAuthRow from "../components/auth/SocialOAuthRow.jsx";
import { Toast } from "../components/ui/Toast.jsx";
import { useToast } from "../hooks/useToast.js";
import { api } from "../lib/api.js";
import { validateLogin } from "../utils/validators.js";

export default function LoginPage() {
	const { toast, show, hide } = useToast();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const navigate = useNavigate();
	const location = useLocation();
	const redirectTo = location.state?.from?.pathname || "/";

	useEffect(() => {
		const m = sessionStorage.getItem("azul_logout_toast");

		if (m) {
			show({ title: "Logout realizado", message: m, tone: "success" });
			sessionStorage.removeItem("azul_logout_toast");
		}
	}, [show]);

	async function handleSubmit(e) {
		e.preventDefault();
		setError("");

		const v = validateLogin({ email, password });
		if (v) return setError(v);

		setLoading(true);
		try {
			const res = await api.post("/accounts/auth/login/", { email, password }, { withAuth: false });

			console.log(res);
			console.log({ email, password });

			if (!res.ok) {
				const data = await res.json().catch(() => null);
				const detail =
					(data && (data.detail || data.non_field_errors)) ||
					"Falha ao entrar. Verifique suas credenciais.";
				throw new Error(Array.isArray(detail) ? detail.join(" ") : String(detail));
			}

			const data = await res.json();
			if (!data?.access) throw new Error("Token de acesso não retornado pelo backend.");

			localStorage.setItem("access_token", data.access);
			if (data.refresh) localStorage.setItem("refresh_token", data.refresh);

			navigate(redirectTo, { replace: true });
			setTimeout(() => {
				if (window.location.pathname === "/login") {
					window.location.href = redirectTo;
				}
			}, 150);
		} catch (err) {
			setError(err?.message || "Erro ao conectar ao servidor.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<AuthLayout title="Blue Finance" subtitle="Entre com sua conta para acessar o dashboard">
			<form className="mt-8 space-y-4" onSubmit={handleSubmit}>
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
					autoComplete="current-password"
					placeholder="********"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					isPassword
				/>
				<FormError message={error} />
				<Button type="submit" disabled={loading}>
					{loading ? "Entrando..." : "Entrar"}
				</Button>
				<SocialOAuthRow
					onGoogle={() =>
						show({
							title: "Em breve",
							message: "Login com Google ainda não está habilitado.",
							tone: "error",
						})
					}
				/>
			</form>

			<p className="text-center text-sm mt-6 text-gray-600 dark:text-gray-400">
				Não tem uma conta?{" "}
				<Link to="/register" className="text-blue-600 hover:underline">
					Cadastre-se
				</Link>
			</p>

			<footer className="mt-10 text-center text-xs text-gray-400">
				Blue Finance © 2025 – App de Gerenciamento Financeiro Pessoal
			</footer>
			<Toast toast={toast} onClose={hide} />
		</AuthLayout>
	);
}
