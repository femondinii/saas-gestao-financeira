import { parseBRLToNumber } from "./formatters";

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

export const validateWallet = ({ name, initialBalance }) => {
    const numberInitial = parseBRLToNumber(initialBalance);

    if (!name?.trim()) {
        return "Informe o nome da carteira.";
    }

    if (!Number.isFinite(numberInitial)) {
        return "Informe um saldo inicial válido.";
    }

    if (name.trim().length > 60) {
        return "Nome pode ter no máximo 60 caracteres.";
    }

    return null;
};

export const validateTransaction = ({ description, type, amountInput, date }) => {
    const amt = parseBRLToNumber(amountInput);

    if (!Number.isFinite(amt) || amt <= 0) {
        return "Informe um valor válido maior que zero";
    }

    if (type !== "income" && type !== "expense") {
        return "Selecione o tipo";
    }

    if (!date) {
        return "Informe a data";
    }

    if (description && description.trim().length > 140) {
        return "Descrição pode ter no máximo 140 caracteres";
    }

    return null;
};