export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin({ email, password }) {
    if (!emailRegex.test(email)) {
        return "Digite um email válido"
    }

    if (!password || password.length < 6) {
        return "A senha deve conter pelo menos 8 caracteres"
    }
    return null;
}

export function validateRegister({ name, email, password }) {
    if (!name || !name.trim()) {
        return "Informe seu nome completo"
    }

    if (!emailRegex.test(email)) {
        return "Digite um email válido"
    }

    if (!password || password.length < 6) {
        return "A senha deve conter pelo menos 8 caracteres"
    }

    return null;
}