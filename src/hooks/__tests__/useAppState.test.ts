import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useAppState } from "../useAppState";

describe("useAppState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults lastMemoId to null when nothing is persisted", () => {
    const { result } = renderHook(() => useAppState());
    expect(result.current.lastMemoId).toBeNull();
  });

  it("restores lastMemoId from localStorage on mount", () => {
    localStorage.setItem(
      "hyut-app-state",
      JSON.stringify({ lastMemoId: "existing-id" }),
    );
    const { result } = renderHook(() => useAppState());
    expect(result.current.lastMemoId).toBe("existing-id");
  });

  it("falls back to null when localStorage contains invalid JSON", () => {
    localStorage.setItem("hyut-app-state", "not valid json");
    const { result } = renderHook(() => useAppState());
    expect(result.current.lastMemoId).toBeNull();
  });

  it("setLastMemoId updates state and persists it to localStorage", () => {
    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.setLastMemoId("memo-1");
    });

    expect(result.current.lastMemoId).toBe("memo-1");
    expect(JSON.parse(localStorage.getItem("hyut-app-state") ?? "{}")).toEqual({
      lastMemoId: "memo-1",
    });
  });

  it("setLastMemoId can clear the stored id back to null", () => {
    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.setLastMemoId("memo-1");
    });
    act(() => {
      result.current.setLastMemoId(null);
    });

    expect(result.current.lastMemoId).toBeNull();
    expect(JSON.parse(localStorage.getItem("hyut-app-state") ?? "{}")).toEqual({
      lastMemoId: null,
    });
  });
});
