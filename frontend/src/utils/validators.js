export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin({ email, password }) {
    if (!emailRegex.test(email)) return "Digite um email válido.";
    if (!password || password.length < 6) return "Senha muito curta.";
    return null;
}

export function validateRegister({ name, email, password }) {
    if (!name || !name.trim()) return "Informe seu nome.";
    if (!emailRegex.test(email)) return "Digite um email válido.";
    if (!password || password.length < 6) return "Senha muito curta.";
    return null;
}