import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TransactionFormModal } from "../../../components/transactions/TransactionFormModal";
import { api } from "../../../lib/api";
import { validateTransaction } from "../../../utils/validators";
import { parseBRLToNumber } from "../../../utils/formatters";

const mockShow = jest.fn();
const mockHide = jest.fn();
const originalError = console.error;

beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation((...args) => {
        const first = args[0];

        if (
            typeof first === "string" &&
            first.includes(
                "Warning: An update to TransactionFormModal inside a test was not wrapped in act"
            )
        ) {
            return;
        }

        originalError(...args);
    });
});

afterAll(() => {
    console.error.mockRestore();
});

jest.mock("../../../lib/api", () => ({
    api: {
        get: jest.fn(),
        post: jest.fn(),
    },
}));

jest.mock("../../../hooks/useToast", () => ({
    useToast: () => ({
        toast: null,
        show: mockShow,
        hide: mockHide,
    }),
}));

jest.mock("../../../utils/validators", () => ({
    validateTransaction: jest.fn(),
}));

jest.mock("../../../utils/formatters", () => ({
    parseBRLToNumber: jest.fn(),
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
    const SelectContext = React.createContext(() => {});

    const Select = ({ onValueChange, children }) => (
        <SelectContext.Provider value={onValueChange}>
            <div>{children}</div>
        </SelectContext.Provider>
    );

    const SelectTrigger = ({ children, className }) => (
        <div className={className}>{children}</div>
    );

    const SelectValue = ({ placeholder, children }) => (
        <span>{children || placeholder}</span>
    );

    const SelectContent = ({ children }) => <div>{children}</div>;

    const SelectItem = ({ value, children }) => {
        const onValueChange = React.useContext(SelectContext);

        return (
            <button type="button" onClick={() => onValueChange(value)}>
                {children}
            </button>
        );
    };

    return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
});

jest.mock("../../../components/categories/CategorySelect", () => ({
    CategorySelect: () => <div>category-select</div>,
}));

let mockWalletMode = "default";

jest.mock("../../../components/wallets/WalletSelect", () => ({
    WalletSelect: ({ label, onChange }) => {
        const id = mockWalletMode === "same"
            ? "1"
            : label === "Carteira de origem"
            ? "2"
            : "1";

        return (
            <button type="button" onClick={() => onChange(id)}>
                {label || "Carteira"}
            </button>
        );
    },
}));

function renderModal(overrideProps = {}) {
    const defaultProps = {
        open: true,
        onOpenChange: jest.fn(),
        title: "Nova transação",
        submitText: "Salvar",
        successMessage: "Sucesso",
    };

    return render(<TransactionFormModal {...defaultProps} {...overrideProps} />);
}

describe("TransactionFormModal", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockWalletMode = "default";

        api.get.mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([]),
            })
        );
    });

    it("shows validation error when validateTransaction returns a message", async () => {
        validateTransaction.mockReturnValue("Validation error");

        renderModal();

        await waitFor(() => {
            expect(api.get).toHaveBeenCalled();
        });

        const submitButton = screen.getByText("Salvar");

        fireEvent.click(submitButton);

        expect(validateTransaction).toHaveBeenCalledTimes(1);
        expect(mockShow).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Erro",
                message: "Validation error",
                tone: "error",
            })
        );
    });

    it("shows error when wallet is not selected", async () => {
        validateTransaction.mockReturnValue(null);
        parseBRLToNumber.mockReturnValue(100);

        const onSubmit = jest.fn();

        renderModal({ onSubmit });

        await waitFor(() => {
            expect(api.get).toHaveBeenCalled();
        });

        const descInput = screen.getByLabelText("Descrição");

        fireEvent.change(descInput, { target: { value: "Supermercado" } });

        const amountInput = screen.getByLabelText("Valor");

        fireEvent.change(amountInput, { target: { value: "1234" } });

        const incomeButton = screen.getByText("Receita");

        fireEvent.click(incomeButton);

        const dateInput = screen.getByLabelText("Data");

        fireEvent.change(dateInput, { target: { value: "2025-01-10" } });

        const submitButton = screen.getByText("Salvar");

        fireEvent.click(submitButton);

        expect(onSubmit).not.toHaveBeenCalled();
        expect(mockShow).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Erro",
                message: "Selecione a carteira.",
                tone: "error",
            })
        );
    });

    it("submits non-credit transaction and shows success", async () => {
        api.get.mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([{ id: 1, kind: "cash" }]),
            })
        );

        validateTransaction.mockReturnValue(null);
        parseBRLToNumber.mockReturnValue(123.45);

        const onSubmit = jest.fn().mockResolvedValue(undefined);
        const onOpenChange = jest.fn();

        renderModal({
            onSubmit,
            onOpenChange,
            successMessage: "Transação criada",
        });

        await waitFor(() => {
            expect(api.get).toHaveBeenCalled();
        });

        const descInput = screen.getByLabelText("Descrição");

        fireEvent.change(descInput, { target: { value: "Supermercado" } });

        const amountInput = screen.getByLabelText("Valor");

        fireEvent.change(amountInput, { target: { value: "1234" } });

        const incomeButton = screen.getByText("Receita");

        fireEvent.click(incomeButton);

        const walletButton = screen.getByText("Carteira");

        fireEvent.click(walletButton);

        const dateInput = screen.getByLabelText("Data");

        fireEvent.change(dateInput, { target: { value: "2025-01-10" } });

        const submitButton = screen.getByText("Salvar");

        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledTimes(1);
        });

        const payload = onSubmit.mock.calls[0][0];

        expect(payload).toMatchObject({
            type: "income",
            category: null,
            amount: "123.45",
            date: "2025-01-10",
            description: "Supermercado",
            wallet: "1",
        });

        expect(mockShow).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Sucesso",
                message: "Transação criada",
                tone: "success",
            })
        );
        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(api.post).not.toHaveBeenCalled();
    });

    it("prefills amount and date from initial values when opened", async () => {
        validateTransaction.mockReturnValue(null);

        renderModal({
            title: "Editar",
            initialValues: { amount: 150.5 },
        });

        await waitFor(() => {
            expect(api.get).toHaveBeenCalled();
        });

        const amountInput = screen.getByLabelText("Valor");

        expect(amountInput.value).not.toBe("");

        const dateInput = screen.getByLabelText("Data");

        expect(dateInput.value).not.toBe("");
    });

    it("resets form state when modal is closed", async () => {
        const initial = {
            description: "Initial",
            categoryId: "10",
            type: "expense",
            date: "2025-01-01",
            walletId: "7",
        };

        const defaultProps = {
            onOpenChange: jest.fn(),
            title: "Editar",
            submitText: "Salvar",
            successMessage: "OK",
        };

        const { rerender } = render(
            <TransactionFormModal open initialValues={initial} {...defaultProps} />
        );

        await waitFor(() => {
            expect(api.get).toHaveBeenCalled();
        });

        const descInput = screen.getByLabelText("Descrição");

        fireEvent.change(descInput, { target: { value: "Changed" } });

        rerender(
            <TransactionFormModal
                open={false}
                initialValues={initial}
                {...defaultProps}
            />
        );

        rerender(
            <TransactionFormModal open initialValues={initial} {...defaultProps} />
        );

        const descAfter = screen.getByLabelText("Descrição");

        expect(descAfter.value).toBe("Initial");
    });

    it("shows credit label when wallet is credit and income selected", async () => {
        api.get.mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([{ id: 1, kind: "credit" }]),
            })
        );

        renderModal({
            title: "Pagamento",
            initialValues: { type: "income", categoryId: "5" },
        });

        await waitFor(() => {
            expect(api.get).toHaveBeenCalled();
        });

        const walletButton = screen.getByText("Carteira");

        fireEvent.click(walletButton);

        const creditLabel = screen.getByText("Pagamento da fatura");

        expect(creditLabel).toBeTruthy();
    });

    it("clears amount when input becomes empty", async () => {
        renderModal();

        await waitFor(() => {
            expect(api.get).toHaveBeenCalled();
        });

        const amountInput = screen.getByLabelText("Valor");

        fireEvent.change(amountInput, { target: { value: "1234" } });
        fireEvent.change(amountInput, { target: { value: "" } });

        expect(amountInput.value).toBe("");
    });

    it("shows origin wallet select when credit income is selected", async () => {
        api.get.mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([{ id: 1, kind: "credit" }]),
            })
        );

        renderModal({
            title: "Pagamento fatura",
        });

        await waitFor(() => {
            expect(api.get).toHaveBeenCalled();
        });

        const walletButton = screen.getByText("Carteira");

        fireEvent.click(walletButton);

        const creditLabel = screen.getByText("Pagamento da fatura");

        fireEvent.click(creditLabel);

        const originLabel = screen.getByText("Carteira de origem");

        expect(originLabel).toBeTruthy();
    });

    it("shows error when credit payment has no origin wallet", async () => {
        api.get.mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([{ id: 1, kind: "credit" }]),
            })
        );

        validateTransaction.mockReturnValue(null);
        parseBRLToNumber.mockReturnValue(100);

        const onSuccess = jest.fn();

        renderModal({
            title: "Pagamento fatura",
            submitText: "Salvar",
            onSuccess,
        });

        await waitFor(() => {
            expect(api.get).toHaveBeenCalled();
        });

        const amountInput = screen.getByLabelText("Valor");

        fireEvent.change(amountInput, { target: { value: "1000" } });

        const walletButton = screen.getByText("Carteira");

        fireEvent.click(walletButton);

        const creditLabel = screen.getByText("Pagamento da fatura");

        fireEvent.click(creditLabel);

        const dateInput = screen.getByLabelText("Data");

        fireEvent.change(dateInput, { target: { value: "2025-01-10" } });

        const submitButton = screen.getByText("Registrar pagamento");

        fireEvent.click(submitButton);

        expect(onSuccess).not.toHaveBeenCalled();
        expect(api.post).not.toHaveBeenCalled();
        expect(mockShow).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Erro",
                message: "Selecione a carteira de origem do pagamento.",
                tone: "error",
            })
        );
    });

    it("shows error when origin and destination wallets are the same", async () => {
        mockWalletMode = "same";

        api.get.mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([{ id: 1, kind: "credit" }]),
            })
        );

        validateTransaction.mockReturnValue(null);
        parseBRLToNumber.mockReturnValue(100);

        renderModal({
            title: "Pagamento fatura",
        });

        await waitFor(() => {
            expect(api.get).toHaveBeenCalled();
        });

        const amountInput = screen.getByLabelText("Valor");

        fireEvent.change(amountInput, { target: { value: "1000" } });

        const walletButton = screen.getByText("Carteira");

        fireEvent.click(walletButton);

        const creditLabel = screen.getByText("Pagamento da fatura");

        fireEvent.click(creditLabel);

        const originButton = screen.getByText("Carteira de origem");

        fireEvent.click(originButton);

        const dateInput = screen.getByLabelText("Data");

        fireEvent.change(dateInput, { target: { value: "2025-01-10" } });

        const submitButton = screen.getByText("Registrar pagamento");

        fireEvent.click(submitButton);

        expect(mockShow).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Erro",
                message: "Origem e destino devem ser carteiras diferentes.",
                tone: "error",
            })
        );
    });

    it("performs credit payment transfer successfully", async () => {
        api.get.mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([{ id: 1, kind: "credit" }]),
            })
        );

        validateTransaction.mockReturnValue(null);
        parseBRLToNumber.mockReturnValue(250.5);

        api.post.mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({}),
            })
        );

        const onSuccess = jest.fn();
        const onOpenChange = jest.fn();

        renderModal({
            title: "Pagamento fatura",
            submitText: "Salvar",
            successMessage: "OK",
            onSuccess,
            onOpenChange,
        });

        await waitFor(() => {
            expect(api.get).toHaveBeenCalled();
        });

        const descInput = screen.getByLabelText("Descrição");

        fireEvent.change(descInput, { target: { value: "Pagamento fatura" } });

        const amountInput = screen.getByLabelText("Valor");

        fireEvent.change(amountInput, { target: { value: "25050" } });

        const walletButton = screen.getByText("Carteira");

        fireEvent.click(walletButton);

        const creditLabel = screen.getByText("Pagamento da fatura");

        fireEvent.click(creditLabel);

        const originButton = screen.getByText("Carteira de origem");

        fireEvent.click(originButton);

        const dateInput = screen.getByLabelText("Data");

        fireEvent.change(dateInput, { target: { value: "2025-01-10" } });

        const submitButton = screen.getByText("Registrar pagamento");

        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledTimes(1);
        });

        const [url, body] = api.post.mock.calls[0];

        expect(url).toBe("/finance/transactions/transfer/");
        expect(body).toMatchObject({
            from_wallet_id: "2",
            to_wallet_id: "1",
            amount: 250.5,
            date: "2025-01-10",
            description: "Pagamento fatura",
        });

        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(mockShow).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Sucesso",
                message: "Pagamento registrado",
                tone: "success",
            })
        );
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("shows transfer error from API when credit payment fails", async () => {
        api.get.mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([{ id: 1, kind: "credit" }]),
            })
        );

        validateTransaction.mockReturnValue(null);
        parseBRLToNumber.mockReturnValue(300);

        api.post.mockImplementation(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ detail: "Erro de transferência" }),
            })
        );

        renderModal({
            title: "Pagamento fatura",
            submitText: "Salvar",
            successMessage: "OK",
        });

        await waitFor(() => {
            expect(api.get).toHaveBeenCalled();
        });

        const amountInput = screen.getByLabelText("Valor");

        fireEvent.change(amountInput, { target: { value: "30000" } });

        const walletButton = screen.getByText("Carteira");

        fireEvent.click(walletButton);

        const creditLabel = screen.getByText("Pagamento da fatura");

        fireEvent.click(creditLabel);

        const originButton = screen.getByText("Carteira de origem");

        fireEvent.click(originButton);

        const dateInput = screen.getByLabelText("Data");

        fireEvent.change(dateInput, { target: { value: "2025-01-10" } });

        const submitButton = screen.getByText("Registrar pagamento");

        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledTimes(1);
        });

        expect(mockShow).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Erro",
                message: "Erro de transferência",
                tone: "error",
            })
        );
    });
});
