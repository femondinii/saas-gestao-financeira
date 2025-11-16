import { renderHook, waitFor, act } from "@testing-library/react";
import { api } from "../../../lib/api";
import { usePlans } from "../../../components/ai-planning/usePlans";

jest.mock("../../../lib/api", () => ({
  api: {
    get: jest.fn(),
    del: jest.fn(),
  },
}));

const mockPlans = [
  {
    id: 1,
    title: "Plano 1",
    template: "Template 1",
    created_at: "2025-11-14T00:00:00Z",
    description: "Desc 1",
    spec: { overview: { summary: "Resumo" } },
  },
];

describe("usePlans hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads plans successfully", async () => {
    api.get.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ results: mockPlans }),
    });

    const { result } = renderHook(() => usePlans());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(api.get).toHaveBeenCalledWith("/finance/ai/plans/", {
      withAuth: true,
    });
    expect(result.current.error).toBe("");
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({
      id: 1,
      title: "Plano 1",
      templateTitle: "Template 1",
      description: "Desc 1",
    });
  });

  it("sets an error when API request fails", async () => {
    api.get.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ detail: "Erro interno" }),
    });

    const { result } = renderHook(() => usePlans());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.error).toBe("Erro interno");
  });

  it("removes a plan correctly", async () => {
    api.get.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ results: mockPlans }),
    });

    api.del.mockResolvedValue({
      ok: true,
      status: 204,
      json: jest.fn().mockResolvedValue({}),
    });

    const { result } = renderHook(() => usePlans());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toHaveLength(1);

    await act(async () => {
      await result.current.remove(1);
    });

    expect(api.del).toHaveBeenCalledWith("/finance/ai/plans/1/", {
      withAuth: true,
    });
    expect(result.current.items).toHaveLength(0);
  });

  it("allows manual refresh to be called", async () => {
    api.get.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ results: mockPlans }),
    });

    const { result } = renderHook(() => usePlans());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
