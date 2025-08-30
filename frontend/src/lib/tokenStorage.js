export const tokenStorage = {
    get access() { return localStorage.getItem('access_token') || ''; },
    set access(v) { localStorage.setItem('access_token', v || ''); },
    get refresh() { return localStorage.getItem('refresh_token') || ''; },
    set refresh(v) { localStorage.setItem('refresh_token', v || ''); },
    clear() { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); }
};