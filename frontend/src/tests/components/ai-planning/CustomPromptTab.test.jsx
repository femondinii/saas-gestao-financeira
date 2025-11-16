import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CustomPromptTab from "../../../components/ai-planning/CustomPromptTab";
import { api } from "../../../lib/api";

const mockShow = jest.fn();

jest.mock("../../../hooks/useToast", () => ({
    useToast: () => ({
        show: mockShow,
        toast: null,
        hide: jest.fn(),
    })
}));

jest.mock("../../../utils/financialPromptValidator", () => ({
    validateFinancialPromptLocal: () => [],
    sanitizePromptLocal: (s) => s
}));

jest.mock("../../../lib/api", () => ({
    api: { post: jest.fn() },
}));

jest.mock("@lottiefiles/dotlottie-react", () => ({
    DotLottieReact: () => <div data-testid="lottie" />,
}));

window.scrollTo = jest.fn();

describe("CustomPromptTab tests", () => {
    beforeEach(() => jest.clearAllMocks());

    it("calls API and shows success toast", async () => {
        api.post.mockResolvedValue({
            ok: true,
            json: async () => ({
                data: { title: "Test Plan", spec: {} },
            }),
        });

        render(<CustomPromptTab onSaved={() => {}} />);

        const textarea = screen.getByRole("textbox");
        const button = screen.getByRole("button");

        fireEvent.change(textarea, { target: { value: "valid prompt" } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledTimes(1);
        });

        await waitFor(() => {
            expect(mockShow).toHaveBeenCalled();
        });
    });

    it("shows error toast when API fails", async () => {
        api.post.mockResolvedValue({
            ok: false,
            json: async () => ({ detail: "Error" }),
        });

        render(<CustomPromptTab onSaved={() => {}} />);

        const textarea = screen.getByRole("textbox");
        const button = screen.getByRole("button");

        fireEvent.change(textarea, { target: { value: "any text" } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalled();
        });

        await waitFor(() => {
            expect(mockShow).toHaveBeenCalled();
        });
    });
});
