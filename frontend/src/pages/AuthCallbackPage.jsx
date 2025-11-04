import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../lib/api.js";
import { Toast } from "../components/ui/Toast.jsx";
import { useToast } from "../hooks/useToast.js";
import { LoadingOverlay } from "../components/ui/Spinner.jsx";

export default function AuthCallbackPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast, show, hide } = useToast();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const run = async () => {
            const code = new URLSearchParams(location.search).get("code");

            if (!code) {
                show({ title: "Erro", message: "Código não fornecido.", tone: "error" });
                navigate("/login");
                return;
            }

            try {
                setLoading(true);
                const res = await api.post("/accounts/auth/google/callback/", { code }, { withAuth: false });
                if (!res.ok) throw new Error("Erro ao autenticar");

                const data = await res.json();
                localStorage.setItem("access_token", data.access);
                navigate("/", { replace: true });
                setLoading(false);
            } catch (err) {
                show({ title: "Erro", message: err.message, tone: "error" });
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [location.search, navigate, show]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            {loading ? (
                <LoadingOverlay
                    size="lg"
                    text="Autenticando..."
                />
            ) : (
                <Toast
                    toast={toast}
                    onClose={hide}
                />
            )}
        </div>
    );
}