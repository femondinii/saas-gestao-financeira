import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CategoryGrid } from "../../../components/categories/CategoryGrid";
import { api } from "../../../lib/api";
import * as AlertModalModule from "../../../components/ui/AlertModal";

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

jest.mock("../../../components/ui/Spinner", () => ({
    LoadingOverlay: () => <div>loading-spinner</div>,
}));

jest.mock("../../../components/ui/AlertModal", () => {
    let latestProps;

    const AlertModal = (props) => {
        latestProps = props;

        if (!props.open) return null;

        return (
            <div>
                <div>{props.title}</div>
                <div>{props.message}</div>
                <button onClick={props.onConfirm}>Confirm</button>
                <button onClick={props.onCancel}>Cancel</button>
            </div>
        );
    };

    AlertModal.__getLastProps = () => latestProps;

    return { AlertModal };
});

jest.mock("../../../components/ui/Toast", () => ({
    Toast: () => null,
}));

jest.mock("../../../components/ui/EmptyState", () => ({
    EmptyState: () => <div>empty-state</div>,
}));

describe("CategoryGrid", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("shows loading overlay when loading is true", () => {
        render(<CategoryGrid items={[]} loading={true} refetch={jest.fn()} />);

        const spinner = screen.getByText("loading-spinner");

        expect(spinner).toBeTruthy();
    });

    it("renders EmptyState when there are no user categories", () => {
        const items = [{ id: 1, name: "System", is_system: true }];

        render(<CategoryGrid items={items} loading={false} refetch={jest.fn()} />);

        const empty = screen.getByText("empty-state");

        expect(empty).toBeTruthy();
    });

    it("filters out system categories and opens modal on delete click", () => {
        const items = [
            { id: 1, name: "Category A", is_system: false },
            { id: 2, name: "System Category", is_system: true },
        ];

        render(<CategoryGrid items={items} loading={false} refetch={jest.fn()} />);

        const userCategory = screen.getByText("Category A");

        expect(userCategory).toBeTruthy();

        const systemCategory = screen.queryByText("System Category");

        expect(systemCategory).toBeNull();

        const button = screen.getByRole("button");

        fireEvent.click(button);

        const modalTitle = screen.getByText("Deletar categoria");

        expect(modalTitle).toBeTruthy();
    });

    it("deletes category successfully and calls refetch and success toast", async () => {
        api.post.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({}),
        });

        const items = [{ id: 1, name: "Category A", is_system: false }];
        const refetch = jest.fn();

        render(<CategoryGrid items={items} loading={false} refetch={refetch} />);

        const button = screen.getByRole("button");

        fireEvent.click(button);

        const confirm = screen.getByText("Confirm");

        fireEvent.click(confirm);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith(
                "/finance/categories/1/archive/",
                {}
            );
        });

        expect(mockShow).toHaveBeenCalledWith(
            expect.objectContaining({
                tone: "success",
                title: "Categoria deletada",
            })
        );
        expect(refetch).toHaveBeenCalledTimes(1);
    });

    it("shows error toast when API fails to delete", async () => {
        api.post.mockResolvedValue({
            ok: false,
            json: jest.fn().mockResolvedValue({
                detail: "Erro ao deletar",
            }),
        });

        const items = [{ id: 1, name: "Category A", is_system: false }];

        render(<CategoryGrid items={items} loading={false} refetch={jest.fn()} />);

        const button = screen.getByRole("button");

        fireEvent.click(button);

        const confirm = screen.getByText("Confirm");

        fireEvent.click(confirm);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalled();
        });

        expect(mockShow).toHaveBeenCalledWith(
            expect.objectContaining({
                tone: "error",
                title: "Erro ao deletar",
            })
        );
    });

    it("cancels deletion and resets state", () => {
        const items = [{ id: 1, name: "Category A", is_system: false }];

        render(<CategoryGrid items={items} loading={false} refetch={jest.fn()} />);

        const button = screen.getByRole("button");

        fireEvent.click(button);

        const cancel = screen.getByText("Cancel");

        fireEvent.click(cancel);

        const modalTitle = screen.queryByText("Deletar categoria");

        expect(modalTitle).toBeNull();
        expect(api.post).not.toHaveBeenCalled();
    });

    it("does nothing when confirm is called without a selected category", async () => {
        render(<CategoryGrid items={[]} loading={false} refetch={jest.fn()} />);

        const { AlertModal } = AlertModalModule;
        const lastProps = AlertModal.__getLastProps();
        await lastProps.onConfirm();

        expect(api.post).not.toHaveBeenCalled();
        expect(mockShow).not.toHaveBeenCalled();
    });
});
