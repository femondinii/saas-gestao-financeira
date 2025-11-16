import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WalletFormModal } from "../../../components/wallets/WalletFormModal";
import { validateWallet } from "../../../utils/validators";
import { parseBRLToNumber, formatBRL } from "../../../utils/formatters";

const mockShow = jest.fn();
const mockHide = jest.fn();

jest.mock("../../../hooks/useToast", () => ({
    useToast: () => ({
        toast: null,
        show: mockShow,
        hide: mockHide,
    }),
}));

jest.mock("../../../utils/validators", () => ({
    validateWallet: jest.fn(),
}));

jest.mock("../../../utils/formatters", () => ({
    parseBRLToNumber: jest.fn(),
    formatBRL: jest.fn((n) => `R$ ${n.toFixed(2)}`),
}));

jest.mock("../../../components/ui/Dialog", () => ({
    Dialog: ({ children }) => <div>{children}</div>,
    DialogContent: ({ children }) => <div>{children}</div>,
    DialogHeader: ({ children }) => <div>{children}</div>,
    DialogTitle: ({ children }) => <div>{children}</div>,
    DialogTrigger: ({ children }) => <div>{children}</div>,
    DialogClose: ({ children }) => <div>{children}</div>,
    DialogFooter: ({ children }) => <div>{children}</div>,
}));

jest.mock("../../../components/ui/Button", () => ({
    Button: ({ children, ...rest }) => <button {...rest}>{children}</button>,
}));

jest.mock("../../../components/ui/Input", () => ({
    Input: (props) => <input {...props} />,
}));

jest.mock("../../../components/ui/Label", () => ({
    Label: ({ htmlFor, children }) => <label htmlFor={htmlFor}>{children}</label>,
}));

jest.mock("../../../components/ui/Toast", () => ({
    Toast: () => null,
}));

jest.mock("../../../components/ui/Select", () => {
    const React = require("react");
    const Ctx = React.createContext(() => {});

    return {
        Select: ({ onValueChange, children }) => (
            <Ctx.Provider value={onValueChange}>{children}</Ctx.Provider>
        ),
        SelectTrigger: ({ children }) => <div>{children}</div>,
        SelectValue: ({ placeholder, children }) => (
            <span>{children || placeholder}</span>
        ),
        SelectContent: ({ children }) => <div>{children}</div>,
        SelectItem: ({ value, children }) => {
            const onValueChange = React.useContext(Ctx);

            return (
                <button type="button" onClick={() => onValueChange(value)}>
                    {children}
                </button>
            );
        },
    };
});

function renderModal(overrides = {}) {
    const defaultProps = {
        open: true,
        onOpenChange: jest.fn(),
        onSubmit: jest.fn(),
    };

    return render(<WalletFormModal {...defaultProps} {...overrides} />);
}

describe("WalletFormModal", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        validateWallet.mockReturnValue(null);
        parseBRLToNumber.mockReturnValue(123.45);
    });

    it("shows validation error if validateWallet returns message", () => {
        validateWallet.mockReturnValueOnce("Erro de validação");

        renderModal();

        const submit = screen.getByText("Adicionar");
        fireEvent.click(submit);

        expect(mockShow).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Erro",
                message: "Erro de validação",
                tone: "error",
            })
        );
    });

    it("formats amount input correctly", () => {
        renderModal();

        const input = screen.getByLabelText("Saldo inicial");

        fireEvent.change(input, { target: { value: "5000" } });

        expect(formatBRL).toHaveBeenCalledTimes(1);
    });


    it("clears amount when user deletes input", () => {
        renderModal();
        const amount = screen.getByLabelText("Saldo inicial");

        fireEvent.change(amount, { target: { value: "5000" } });
        fireEvent.change(amount, { target: { value: "" } });

        expect(amount.value).toBe("");
    });

    it("submits successfully and closes modal", async () => {
        const onSubmit = jest.fn().mockResolvedValue(undefined);
        const onOpenChange = jest.fn();

        renderModal({ onSubmit, onOpenChange });

        const name = screen.getByLabelText("Nome");

        fireEvent.change(name, { target: { value: "Minha carteira" } });

        const color = screen.getByLabelText("Cor");

        fireEvent.change(color, { target: { value: "#ABCDEF" } });

        const typeBtn = screen.getByText("Dinheiro");

        fireEvent.click(typeBtn);

        const submit = screen.getByText("Adicionar");

        fireEvent.click(submit);

        await waitFor(() => expect(onSubmit).toHaveBeenCalled());

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "Minha carteira",
                kind: "cash",
                color: "#ABCDEF",
            })
        );

        expect(mockShow).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Sucesso",
                message: "Carteira criada com sucesso.",
                tone: "success",
            })
        );
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("shows error on submit failure", async () => {
        const onSubmit = jest.fn().mockRejectedValue(new Error("Erro interno"));

        renderModal({ onSubmit });

        const name = screen.getByLabelText("Nome");

        fireEvent.change(name, { target: { value: "Falhou" } });

        const color = screen.getByLabelText("Cor");

        fireEvent.change(color, { target: { value: "#123456" } });

        const submit = screen.getByText("Adicionar");

        fireEvent.click(submit);

        await waitFor(() => {
            expect(mockShow).toHaveBeenCalledWith(
                expect.objectContaining({
                title: "Erro",
                message: "Erro interno",
                tone: "error",
                })
            );
        });
    });

    it("resets fields when modal closes", () => {
        const { rerender } = renderModal({
            open: true,
            initialValues: {
                name: "Teste",
                kind: "savings",
                color: "#FF0000",
            },
        });

        const name = screen.getByLabelText("Nome");

        fireEvent.change(name, { target: { value: "Alterado" } });

        rerender(
            <WalletFormModal
                open={false}
                onOpenChange={jest.fn()}
                initialValues={{
                name: "Teste",
                kind: "savings",
                color: "#FF0000",
                }}
            />
        );

        rerender(
            <WalletFormModal
                open={true}
                onOpenChange={jest.fn()}
                initialValues={{
                    name: "Teste",
                    kind: "savings",
                    color: "#FF0000",
                }}
            />
        );

        expect(screen.getByLabelText("Nome").value).toBe("Teste");
    });

    it("loads initial values correctly", () => {
        renderModal({
            initialValues: {
                name: "Inicial",
                kind: "investment",
                color: "#00FF00",
            },
        });

        expect(screen.getByLabelText("Nome").value).toBe("Inicial");

        const colorInput = screen.getByLabelText("Cor");

        expect(colorInput.value.toLowerCase()).toBe("#00ff00");

        expect(screen.getByText("Investimento")).toBeTruthy();
    });
});
