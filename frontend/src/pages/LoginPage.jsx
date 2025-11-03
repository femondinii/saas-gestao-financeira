import React, { useState } from "react";
import AuthLayout from "../components/auth/AuthLayout.jsx";
import { Toast } from "../components/ui/Toast.jsx";
import { useToast } from "../hooks/useToast.js";
import { api } from "../lib/api.js";
import SocialOAuthRow from "../components/auth/SocialOAuthRow.jsx";

export default function LoginPage() {
  const { toast, show, hide } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    try {
      const res = await api.get("/accounts/auth/google/", { withAuth: false });
      if (!res.ok) {
        throw new Error("Falha ao iniciar o login com Google.");
      }
      const data = await res.json();
      window.location.href = data.auth_url;
    } catch (err) {
      show({ title: "Erro", message: err.message || "Erro ao conectar ao servidor.", tone: "error" });
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Blue Finance" subtitle="Entre com sua conta para acessar o dashboard">
      <div className="mt-8 space-y-4">
        <SocialOAuthRow
          onGoogle={handleGoogleLogin}
          disabled={loading}
        />
      </div>

      <footer className="mt-10 text-center text-xs text-gray-400">
        Blue Finance © 2025 – App de Gerenciamento Financeiro Pessoal
      </footer>
      <Toast toast={toast} onClose={hide} />
    </AuthLayout>
  );
}