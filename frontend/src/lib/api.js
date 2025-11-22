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

	return res;
}
