import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

const API_LIST = "/finance/ai/plans/";
const API_ITEM = (id) => `${API_LIST}${id}/`;

export function usePlans() {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const fetchPlans = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const res = await api.get(API_LIST, { withAuth: true });
			const json = await res.json().catch(() => ({}));

			if (!res.ok) {
                throw new Error(json?.detail || `HTTP ${res.status}`);
			}

			const results = Array.isArray(json?.results) ? json.results : (Array.isArray(json) ? json : []);
			const mapped = results.map((p) => ({
				id: p.id,
				title: p.title || "Plano Financeiro",
				templateTitle: p.template || "—",
				createdAt: p.created_at || p.createdAt || null,
				status: p.status || "Ativo",
				description: p.description || p?.spec?.overview?.summary || "",
				spec: p.spec || null,
			}));
			setItems(mapped);
		} catch (e) {
			setError(e.message || "Falha ao carregar planos");
		} finally {
			setLoading(false);
		}
	}, []);

	const removePlan = useCallback(async (id) => {
		await api.del(API_ITEM(id), { withAuth: true });
		setItems((prev) => prev.filter((p) => p.id !== id));
	}, []);

	useEffect(() => {
		fetchPlans();
	}, [fetchPlans]);

	return useMemo(() => ({
		items,
		loading,
		error,
		refresh: fetchPlans,
		remove: removePlan,
	}), [items, loading, error, fetchPlans, removePlan]);
}
