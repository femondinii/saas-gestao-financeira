import { renderHook, act } from "@testing-library/react";
import { useToast } from "../../hooks/useToast";

jest.useFakeTimers();

describe("useToast", () => {
  it("starts with null toast", () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toast).toBeNull();
  });

  it("show() should set toast value", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.show({ title: "Hi" });
    });

    expect(result.current.toast).toEqual({ title: "Hi" });
  });

  it("hide() should clear the toast", () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.show({ msg: "x" });
    });
    act(() => {
      result.current.hide();
    });

    expect(result.current.toast).toBeNull();
  });

  it("auto-hides after default timeout (3500ms)", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.show({ title: "Auto" });
    });

    expect(result.current.toast).not.toBeNull();

    // avança 3.5 segundos
    act(() => {
      jest.advanceTimersByTime(3500);
    });

    expect(result.current.toast).toBeNull();
  });

  it("auto-hides after custom timeout", () => {
    const { result } = renderHook(() => useToast(1000));

    act(() => {
      result.current.show({ title: "Custom" });
    });

    expect(result.current.toast).not.toBeNull();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.toast).toBeNull();
  });
});
