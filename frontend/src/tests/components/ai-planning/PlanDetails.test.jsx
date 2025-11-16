import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PlanDetails from "../../../components/ai-planning/PlanDetails";
import { api } from "../../../lib/api";

const mockShow = jest.fn();

jest.mock("../../../hooks/useToast", () => ({
	useToast: () => ({
		show: mockShow,
		hide: jest.fn(),
		toast: null
	})
}));

jest.mock("../../../lib/api", () => ({
	api: {
		post: jest.fn()
	}
}));

describe("PlanDetails (enhanced simple tests)", () => {
	const fullPlan = {
		title: "Main Plan",
		spec: {
			title: "Main Plan",
			overview: {
				objective: "Save 10k",
				summary: "This is a summary",
				insights: ["Insight A", "Insight B"]
			},
			strategy: {
				title: "Strategy Title",
				text: "Strategy main text",
				steps: ["Step 1", "Step 2"]
			},
			goals: {
				items: [
					{
						title: "Goal 1",
						target: 5000,
						current: 1000,
						deadline: "2025",
						category: "Invest",
						notes: ["A", "B"]
					}
				]
			},
			suggestions: {
				goals: [
					{
						title: "Suggestion 1",
						target: 2000,
						deadline: "2024",
						category: "Other"
					}
				]
			},
			risks: [
				{
					title: "High risk",
					severity: "high",
					description: "desc",
					likelihood: "alta",
					impact: "grande",
					mitigation: "mitigar"
				}
			]
		}
	};

	it("renders plan title and overview fields", () => {
		render(<PlanDetails plan={fullPlan} onBack={() => {}} />);

		expect(screen.getByText("Main Plan")).toBeTruthy();
		expect(screen.getByText("Save 10k")).toBeTruthy();
		expect(screen.getByText("This is a summary")).toBeTruthy();
	});

	it("renders insights list", () => {
		render(<PlanDetails plan={fullPlan} onBack={() => {}} />);
		expect(screen.getByText("Insight A")).toBeTruthy();
		expect(screen.getByText("Insight B")).toBeTruthy();
	});

	it("renders strategy steps", () => {
		render(<PlanDetails plan={fullPlan} onBack={() => {}} />);
		expect(screen.getByText("Strategy Title")).toBeTruthy();
		expect(screen.getByText("Step 1")).toBeTruthy();
		expect(screen.getByText("Step 2")).toBeTruthy();
	});

	it("renders goals", () => {
		render(<PlanDetails plan={fullPlan} onBack={() => {}} />);
		expect(screen.getByText("Goal 1")).toBeTruthy();
		expect(screen.getByText("2025")).toBeTruthy();
		expect(screen.getByText("Invest")).toBeTruthy();
		expect(screen.getByText("A")).toBeTruthy();
		expect(screen.getByText("B")).toBeTruthy();
	});

	it("renders suggestions", () => {
		render(<PlanDetails plan={fullPlan} onBack={() => {}} />);
		expect(screen.getByText("Suggestion 1")).toBeTruthy();
		expect(screen.getByText("2024")).toBeTruthy();
		expect(screen.getByText("Other")).toBeTruthy();
	});

	it("renders risks block", () => {
		render(<PlanDetails plan={fullPlan} onBack={() => {}} />);
		expect(screen.getByText("High risk")).toBeTruthy();
		expect(screen.getByText("desc")).toBeTruthy();
		expect(screen.getByText("alta")).toBeTruthy();
		expect(screen.getByText("grande")).toBeTruthy();
		expect(screen.getByText("mitigar")).toBeTruthy();
	});

	it("calls onBack when clicking the back button", () => {
		const mockBack = jest.fn();
		render(<PlanDetails plan={fullPlan} onBack={mockBack} />);

		const buttons = screen.getAllByRole("button");
		fireEvent.click(buttons[0]);

		expect(mockBack).toHaveBeenCalledTimes(1);
	});

	it("successfully saves when isCreating=true", async () => {
		api.post.mockResolvedValue({
			ok: true,
			status: 200,
			json: () => Promise.resolve({ data: { id: 10, title: "Saved" } })
		});

		const mockSave = jest.fn();

		render(
			<PlanDetails
				plan={fullPlan}
				onBack={() => {}}
				isCreating={true}
				onSaved={mockSave}
			/>
		);

		const saveBtn = screen.getByText("Salvar");
		fireEvent.click(saveBtn);

		await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
		await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
		await waitFor(() => expect(mockShow).toHaveBeenCalledTimes(1));
	});

	it("shows error toast on failed save", async () => {
		api.post.mockResolvedValue({
			ok: false,
			status: 500,
			json: () => Promise.resolve({ detail: "Error saving" })
		});

		render(<PlanDetails plan={fullPlan} onBack={() => {}} isCreating={true} />);

		const saveBtn = screen.getByText("Salvar");
		fireEvent.click(saveBtn);

		await waitFor(() => expect(mockShow).toHaveBeenCalledTimes(1));
	});

	it("disables button while saving", async () => {
		let resolvePromise;

		api.post.mockReturnValue(
			new Promise((resolve) => {
				resolvePromise = resolve;
			})
		);

		render(<PlanDetails plan={fullPlan} onBack={() => {}} isCreating={true} />);

		const saveBtn = screen.getByText("Salvar");

		expect(saveBtn.disabled).toBe(false);

		fireEvent.click(saveBtn);
		expect(saveBtn.disabled).toBe(true);

		resolvePromise({
			ok: true,
			status: 200,
			json: () => Promise.resolve({})
		});

		await waitFor(() => expect(saveBtn.disabled).toBe(false));
	});
});
