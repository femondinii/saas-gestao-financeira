function getApiBase() {
  const base = "http://localhost:8000/api/accounts";
  return base.replace(/\/$/, "");
}

const API_BASE = getApiBase();

async function tryRefresh() {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) return false;

    try {
        const res = await fetch(`${API_BASE}/auth/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh })
        });

        if (!res.ok) return false;
        const data = await res.json();
        if (data.access) localStorage.setItem('access_token', data.access);
        if (data.refresh) localStorage.setItem('refresh_token', data.refresh);

        return true;
    } catch { return false; }
}


export async function apiFetch(path, { method='GET', body, headers={}, withAuth=true } = {}) {
    const h = { 'Accept': 'application/json', ...headers };

    if (body && !h['Content-Type']) h['Content-Type'] = 'application/json';

    if (withAuth) {
        const access = localStorage.getItem('access_token');
        if (access) h['Authorization'] = `Bearer ${access}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: h,
        body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
        credentials: 'omit',
    });

    if (res.status === 401 && withAuth) {
        const ok = await tryRefresh();

        if (ok) {
            const retryHeaders = { ...h, Authorization: `Bearer ${localStorage.getItem('access_token')}` };

            return fetch(`${API_BASE}${path}`, {
                method,
                headers: retryHeaders,
                body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
            });
        }
    }

    return res;
}


export const api = {
    get: (p, o) => apiFetch(p, { ...o, method: 'GET' }),
    post: (p, b, o) => apiFetch(p, { ...o, method: 'POST', body: b }),
    put: (p, b, o) => apiFetch(p, { ...o, method: 'PUT', body: b }),
    patch: (p, b, o)=> apiFetch(p, { ...o, method: 'PATCH', body: b }),
    del: (p, o) => apiFetch(p, { ...o, method: 'DELETE' }),
};