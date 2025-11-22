function getApiBase() {
	if (typeof window !== "undefined") {
		const { hostname } = window.location;

		if (hostname === "localhost" || hostname === "127.0.0.1") {
			return "http://localhost:8000/api";
		}

		return "/api";
	}

	return "/api";
}

const API_BASE = getApiBase();

async function refreshAccess() {
	const res = await fetch(`${API_BASE}/accounts/auth/refresh/`, {
		method: "POST",
		credentials: "include",
		headers: { "Accept": "application/json" }
	});

	if (!res.ok) return null;

	const data = await res.json().catch(() => ({}));

	return data?.access || null;
}

let refreshPromise = null;

async function getNewAccessLocked() {
	if (!refreshPromise) {
		refreshPromise = (async () => {
			try {
				return await refreshAccess();
			} finally {
				refreshPromise = null;
			}
		})();
	}

	return refreshPromise;
}

export async function apiFetch(
	path,
	{ method = "GET", body, headers = {}, withAuth = true } = {}
) {
	const h = { Accept: "application/json", ...headers };
	const isJsonBody = body && !(body instanceof FormData) && !h["Content-Type"];

	if (isJsonBody) {
		h["Content-Type"] = "application/json";
	}

	const authPath = path.startsWith("/accounts/auth/");

	if (withAuth) {
		const access = localStorage.getItem("access_token");
		if (access) h["Authorization"] = `Bearer ${access}`;
	}

	const target = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
	const init = {
		method,
		headers: h,
		body: body
			? body instanceof FormData
				? body
				: typeof body === "string"
				? body
				: JSON.stringify(body)
			: undefined,
		credentials: authPath ? "include" : "omit",
	};

	let res = await fetch(target, init);

	if (res.status === 401 && withAuth && !authPath) {
		const newAccess = await getNewAccessLocked();

		if (newAccess) {
			localStorage.setItem("access_token", newAccess);
			window.dispatchEvent(new Event("auth:token-updated"));

			const retryHeaders = { ...h, Authorization: `Bearer ${newAccess}` };
			const retryInit = { ...init, headers: retryHeaders };
			res = await fetch(target, retryInit);
		} else {
			window.dispatchEvent(new CustomEvent("auth:required"));
		}
	}

	return res;
}

export const api = {
	get: (p, o) => apiFetch(p, { ...o, method: "GET" }),
	post: (p, b, o) => apiFetch(p, { ...o, method: "POST", body: b }),
	put: (p, b, o) => apiFetch(p, { ...o, method: "PUT", body: b }),
	del: (p, o) => apiFetch(p, { ...o, method: "DELETE" }),
};
