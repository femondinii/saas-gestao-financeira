let timer;

const decodeJwtExpMs = (token) => {
	if (!token) return null;

	try {
		const [, payload] = token.split(".");
		const json = JSON.parse(
			decodeURIComponent(
				atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
					.split("")
					.map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
					.join("")
			)
		);

		return json?.exp ? json.exp * 1000 : null;
	} catch {
		return null;
	}
};

export const scheduleAuthToast = (offsetMs = 30000) => {
	clearTimeout(timer);
	const token = localStorage.getItem("access_token");
	const expMs = decodeJwtExpMs(token);

	if (!expMs) {
        return;
	}

	const ms = Math.max(expMs - Date.now() - offsetMs, 0);

	timer = setTimeout(() => {
		window.dispatchEvent(new CustomEvent("auth:required"));
	}, ms);
};

export const cancelAuthToast = () => {
	clearTimeout(timer);
};
