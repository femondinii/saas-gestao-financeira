import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CategoryModal } from "../../../components/categories/CategoryModal";
import { api } from "../../../lib/api";

const mockShow = jest.fn();
const mockHide = jest.fn();

jest.mock("../../../lib/api", () => ({
    api: {
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

jest.mock("../../../components/ui/Toast", () => ({
    Toast: () => null,
}));

jest.mock("../../../components/ui/ScreenDimmer", () => ({
    ScreenDimmer: ({ show }) => (show ? <div>screen-dimmer</div> : null),
}));

jest.mock("../../../components/categories/CategoryGrid", () => ({
    CategoryGrid: () => <div>category-grid</div>,
}));

jest.mock("../../../components/ui/Dialog", () => ({
    Dialog: ({ children }) => <div>{children}</div>,
    DialogContent: ({ children }) => <div>{children}</div>,
    DialogHeader: ({ children }) => <div>{children}</div>,
    DialogTitle: ({ children }) => <div>{children}</div>,
    DialogFooter: ({ children }) => <div>{children}</div>,
    DialogClose: ({ children }) => <div>{children}</div>,
}));

describe("CategoryModal", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("resets input when modal is closed", () => {
        const setOpen = jest.fn();

        const { rerender } = render(
            <CategoryModal
                open={true}
                setOpen={setOpen}
                onCreated={jest.fn()}
                items={[]}
                refetch={jest.fn()}
                loading={false}
            />
        );

        const input = screen.getByPlaceholderText("Ex.: Investimentos");

        fireEvent.change(input, { target: { value: "My Category" } });
        expect(input.value).toBe("My Category");

        rerender(
            <CategoryModal
                open={false}
                setOpen={setOpen}
                onCreated={jest.fn()}
                items={[]}
                refetch={jest.fn()}
                loading={false}
            />
        );

        const inputAfterClose = screen.getByPlaceholderText("Ex.: Investimentos");

        expect(inputAfterClose.value).toBe("");
    });

    it("shows error toast when name is empty", async () => {
        const setOpen = jest.fn();

        render(
            <CategoryModal
                open={true}
                setOpen={setOpen}
                onCreated={jest.fn()}
                items={[]}
                refetch={jest.fn()}
                loading={false}
            />
        );

        const button = screen.getByText("Criar");

        fireEvent.click(button);

        await waitFor(() => {
            expect(mockShow).toHaveBeenCalledWith(
                expect.objectContaining({
                title: "Erro",
                message: "Informe o nome da categoria",
                tone: "error",
                })
            );
        });
        expect(api.post).not.toHaveBeenCalled();
    });

    it("creates category successfully and closes modal", async () => {
        api.post.mockResolvedValue({
            ok: true,
            json: jest
                .fn()
                .mockResolvedValue({ name: "Created From API" }),
        });

        const setOpen = jest.fn();
        const onCreated = jest.fn();

        render(
            <CategoryModal
                open={true}
                setOpen={setOpen}
                onCreated={onCreated}
                items={[]}
                refetch={jest.fn()}
                loading={false}
            />
        );

        const input = screen.getByPlaceholderText("Ex.: Investimentos");

        fireEvent.change(input, { target: { value: "Local Name" } });

        const button = screen.getByText("Criar");

        fireEvent.click(button);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith("/finance/categories/", {
                name: "Local Name",
            });
        });

        expect(mockShow).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Categoria criada",
                tone: "success",
            })
        );
        expect(onCreated).toHaveBeenCalledWith("Created From API");
        expect(setOpen).toHaveBeenCalledWith(false);
    });

    it("shows error toast when API request fails", async () => {
        api.post.mockResolvedValue({
            ok: false,
            json: jest.fn().mockResolvedValue({
                detail: "Create failed",
            }),
        });

        const setOpen = jest.fn();

        render(
            <CategoryModal
                open={true}
                setOpen={setOpen}
                onCreated={jest.fn()}
                items={[]}
                refetch={jest.fn()}
                loading={false}
            />
        );

        const input = screen.getByPlaceholderText("Ex.: Investimentos");

        fireEvent.change(input, { target: { value: "My Category" } });

        const button = screen.getByText("Criar");

        fireEvent.click(button);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith("/finance/categories/", {
                name: "My Category",
            });
        });

        expect(mockShow).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Erro",
                tone: "error",
            })
        );
        expect(setOpen).not.toHaveBeenCalledWith(false);
    });
});
