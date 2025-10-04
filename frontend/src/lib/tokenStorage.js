export const tokenStorage = {
  get access() { return localStorage.getItem("access_token") || ""; },
  set access(v) { v ? localStorage.setItem("access_token", v) : localStorage.removeItem("access_token"); },
  clear() { localStorage.removeItem("access_token"); }
};