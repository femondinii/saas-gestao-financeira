import { renderHook, waitFor, act } from "@testing-library/react";
import { api } from "../../lib/api";
import { useDashboardData } from "../../hooks/useDashboardData";

jest.mock("../../lib/api", () => ({
    api: {
        get: jest.fn(),
    },
}));

function mockJson(data) {
    return {
        ok: true,
        json: jest.fn().mockResolvedValue(data),
    };
}

describe("useDashboardData", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        api.get.mockResolvedValue(mockJson({}));
    });

    it("loads stats and charts on mount", async () => {
        const { result } = renderHook(() => useDashboardData());

        await waitFor(() => {
            expect(result.current.loading.stats).toBe(false);
        });

        expect(result.current.loading.charts).toBe(false);
        expect(api.get).toHaveBeenCalledTimes(6);
    });

    it("handles stats error", async () => {
        api.get.mockRejectedValueOnce(new Error("Network error"));

        const { result } = renderHook(() => useDashboardData());

        await waitFor(() => {
            expect(result.current.error).toBe("Network error");
        });
    });

    it("handles charts missing data (ok: false case)", async () => {
        api.get.mockResolvedValueOnce(mockJson({}));
        api.get.mockResolvedValueOnce({ ok: false });

        const { result } = renderHook(() => useDashboardData());

        await waitFor(() => {
            expect(result.current.loading.charts).toBe(false);
        });

        expect(result.current.charts.monthly).toEqual([]);
    });

    it("refetch() resets loading and calls endpoints again", async () => {
        const { result } = renderHook(() => useDashboardData());

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledTimes(6);
        });

        act(() => {
            result.current.refetch();
        });

        await waitFor(() => {
            expect(result.current.loading.charts).toBe(true);
        });

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledTimes(12);
        });

        expect(result.current.error).toBe(null);
    });
});
