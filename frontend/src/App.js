import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TransactionPage from "./pages/TransactionPage";
import DashboardPage from "./pages/DashboardPage";
import { Layout } from "./components/layout/Layout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import WalletPage from "./pages/WalletPage";
import { ReauthToast } from "./components/auth/ReauthToast";
import { scheduleAuthToast, cancelAuthToast } from "./lib/authWatcher";

export default function App() {
	const [showReauth, setShowReauth] = useState(false);

	useEffect(() => {
		const onRequired = () => setShowReauth(true);
		window.addEventListener("auth:required", onRequired);

		scheduleAuthToast();

		const onTokenUpdated = () => scheduleAuthToast();
		window.addEventListener("auth:token-updated", onTokenUpdated);

		const onStorage = (e) => {
			if (e.key === "access_token") scheduleAuthToast();
		};
		window.addEventListener("storage", onStorage);

		return () => {
			window.removeEventListener("auth:required", onRequired);
			window.removeEventListener("auth:token-updated", onTokenUpdated);
			window.removeEventListener("storage", onStorage);
			cancelAuthToast();
		};
	}, []);

	return (
		<>
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route path="/register" element={<RegisterPage />} />
				<Route element={<ProtectedRoute />}>
					<Route path="/" element={<Layout />}>
						<Route index element={<DashboardPage />} />
						<Route path="/transactions" element={<TransactionPage />} />
						<Route path="/wallets" element={<WalletPage />} />
					</Route>
				</Route>
			</Routes>

			<ReauthToast
				show={showReauth}
				onDismiss={() => setShowReauth(false)}
			/>
		</>
	);
}
