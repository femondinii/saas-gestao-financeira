import { Trash2 } from "lucide-react";
import TitlePage from "../components/layout/TitlePage";
import { Button } from "../components/ui/Button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter
} from "../components/ui/Card";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Label } from "../components/ui/Label";

export default function SettingsPage() {
    const [data, setData] = useState({ name: "Nome: ", email: "Email: " });

    const fetchUserData = async () => {
        try {
            const res = await api.get("/accounts/auth/me/", { withAuth: true });
            const json = await res.json().catch(() => ({}));

            if (res.ok) {
                const { name, email } = json;

                setData({
                    name: "Nome: " + (name ?? ""),
                    email: "Email: " + (email ?? ""),
                });
            } else {
                throw new Error(json?.detail || json?.error || `HTTP ${res.status}`);
            }
        } catch (error) {
            console.error("Erro ao carregar dados do usuário:", error);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    return (
        <div className="p-6">
            <TitlePage
                title="Configurações"
                subtitle="Configurações da conta"
            />
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Informações da Conta</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Label className="block text-sm font-medium text-gray-700">
                            {data.name}
                        </Label>
                        <Label className="block text-sm font-medium text-gray-700">
                            {data.email}
                        </Label>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        icon={Trash2}
                        className="w-full sm:w-auto inline-flex items-center gap-2 p-3 bg-red-600 hover:bg-red-700"
                    >
                        <><Trash2 className="h-4 w-4 mr-1" />Deletar conta</>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};