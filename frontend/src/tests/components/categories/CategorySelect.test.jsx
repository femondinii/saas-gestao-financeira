import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CategorySelect } from "../../../components/categories/CategorySelect";
import { api } from "../../../lib/api";
import { __setMode } from "../../../components/categories/CategoryCreateButton";

jest.mock("../../../lib/api", () => ({
    api: {
        get: jest.fn(),
    },
}));

jest.mock("../../../components/ui/Select", () => ({
    Select: ({ children }) => <div>{children}</div>,
    SelectTrigger: ({ children, className }) => (
        <div className={className}>{children}</div>
    ),
    SelectValue: ({ placeholder }) => <span>{placeholder}</span>,
    SelectContent: ({ children, className }) => (
        <div className={className}>{children}</div>
    ),
    SelectItem: ({ value, children }) => (
        <div data-value={value}>{children}</div>
    ),
}));

jest.mock("../../../components/categories/CategoryCreateButton", () => {
    let mode = "object";

    const CategoryCreateButton = ({ onCreated }) => (
        <button
            type="button"
            onClick={() => {
                if (mode === "object") {
                onCreated({
                    id: 10,
                    name: "Created Category",
                    is_system: false,
                });
                } else if (mode === "string") {
                onCreated("Created Category");
                } else if (mode === "both") {
                onCreated({
                    id: 10,
                    name: "Created Category",
                    is_system: false,
                });
                onCreated("Created Category");
                }
            }}
        >
            create-category
        </button>
    );

    const __setMode = (next) => {
        mode = next;
    };

    return { CategoryCreateButton, __setMode };
});

describe("CategorySelect", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("fetches and renders categories on mount", async () => {
        api.get.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue([
            { id: 2, name: "Category B", is_system: false },
            { id: 1, name: "Category A", is_system: false },
        ]),
        });

        const onChange = jest.fn();

        render(
        <CategorySelect
            value=""
            onChange={onChange}
            withCreate={false}
        />
        );

        const catA = await screen.findByText("Category A");
        const catB = await screen.findByText("Category B");

        expect(catA).toBeTruthy();
        expect(catB).toBeTruthy();
    });

    it("handles created category with object payload and selects it", async () => {
        api.get.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue([]),
        });

        __setMode("object");

        const onChange = jest.fn();

        render(
            <CategorySelect
                value=""
                onChange={onChange}
                withCreate={true}
            />
        );

        const button = screen.getByText("create-category");

        fireEvent.click(button);

        await waitFor(() => {
            expect(onChange).toHaveBeenCalledWith("10");
        });

        const created = await screen.findByText("Created Category");

        expect(created).toBeTruthy();
    });

    it("handles string payload, refetches and selects by name (selectByName branch)", async () => {
        api.get
            .mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue([]),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue([
                    { id: 99, name: "Created Category", is_system: false },
            ]),
        });

        __setMode("string");

        const onChange = jest.fn();

        render(
            <CategorySelect
            value=""
            onChange={onChange}
            withCreate={true}
            />
        );

        fireEvent.click(screen.getByText("create-category"));

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledTimes(2);
        });

        expect(onChange).toHaveBeenCalledWith("99");

        const created = await screen.findByText("Created Category");
        expect(created).toBeTruthy();
    });
});
