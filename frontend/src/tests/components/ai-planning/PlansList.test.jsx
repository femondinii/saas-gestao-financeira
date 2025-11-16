import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PlansList from "../../../components/ai-planning/PlansList";

describe("PlansList", () => {
    it("calls refresh on mount and shows empty state", async () => {
        const refresh = jest.fn();

        render(
            <PlansList
                plans={[]}
                onSelect={jest.fn()}
                onRemove={jest.fn()}
                refresh={refresh}
            />
        );

        const title = screen.getByText("Meus Planos Financeiros");
        const count = screen.getByText("0 planos criados");

        expect(title).toBeTruthy();
        expect(count).toBeTruthy();

        await waitFor(() => {
            expect(refresh).toHaveBeenCalledTimes(1);
        });
    });

    it("renders plans and triggers onSelect and onRemove", () => {
        const onSelect = jest.fn();
        const onRemove = jest.fn();
        const refresh = jest.fn();

        const plans = [
            {
                id: 1,
                title: "Plano A",
                description: "Descrição do plano",
                createdAt: "2025-11-14T00:00:00Z",
                templateTitle: "Modelo A",
            },
        ];

        render(
            <PlansList
                plans={plans}
                onSelect={onSelect}
                onRemove={onRemove}
                refresh={refresh}
            />
        );

        const count = screen.getByText("1 plano criado");
        const title = screen.getByText("Plano A");
        const description = screen.getByText("Descrição do plano");
        const template = screen.getByText("Modelo A");
        const createdLabel = screen.getByText(/Criado em/);

        expect(count).toBeTruthy();
        expect(title).toBeTruthy();
        expect(description).toBeTruthy();
        expect(template).toBeTruthy();
        expect(createdLabel).toBeTruthy();

        const buttons = screen.getAllByRole("button");

        fireEvent.click(buttons[0]);
        fireEvent.click(buttons[1]);

        expect(onSelect).toHaveBeenCalledWith(1);
        expect(onRemove).toHaveBeenCalledWith(1);
    });
});
