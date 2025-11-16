import { renderHook, act } from "@testing-library/react";
import { useTheme } from "../../hooks/useTheme";

const store = {};

beforeEach(() => {
    Object.keys(store).forEach(k => delete store[k]);
    document.documentElement.className = "";
});

Object.defineProperty(window, "localStorage", {
    value: {
        getItem: (key) => store[key],
        setItem: (key, val) => (store[key] = val),
    },
});

describe("useTheme", () => {
    it("should initialize as light when no dark class is present", () => {
        const { result } = renderHook(() => useTheme());

        expect(result.current.theme).toBe("light");
    });

    it("should initialize as dark if HTML already has dark class", () => {
        document.documentElement.classList.add("dark");
        const { result } = renderHook(() => useTheme());

        expect(result.current.theme).toBe("dark");
    });

    it("should load theme from localStorage on mount", () => {
        store["theme"] = "dark";

        const { result } = renderHook(() => useTheme());

        expect(document.documentElement.classList.contains("dark")).toBe(true);
        expect(result.current.theme).toBe("dark");
    });

    it("toggle() should switch theme and update localStorage", () => {
        const { result } = renderHook(() => useTheme());

        act(() => {
            result.current.toggle();
        });

        expect(result.current.theme).toBe("dark");
        expect(localStorage.getItem("theme")).toBe("dark");
        expect(document.documentElement.classList.contains("dark")).toBe(true);

        act(() => {
            result.current.toggle();
        });

        expect(result.current.theme).toBe("light");
        expect(localStorage.getItem("theme")).toBe("light");
        expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
});
