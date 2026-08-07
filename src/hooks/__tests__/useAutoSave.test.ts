import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const saveMemoMock = vi.hoisted(() => vi.fn());

vi.mock("../../lib/commands", () => ({
  saveMemo: saveMemoMock,
}));

import { useAutoSave } from "../useAutoSave";

describe("useAutoSave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    saveMemoMock.mockReset();
    saveMemoMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not save immediately when save() is called", () => {
    const { result } = renderHook(() => useAutoSave(1000));

    act(() => {
      result.current.save("memo-1", "hello");
    });

    expect(saveMemoMock).not.toHaveBeenCalled();
  });

  it("saves after the debounce delay elapses", async () => {
    const { result } = renderHook(() => useAutoSave(1000));

    act(() => {
      result.current.save("memo-1", "hello");
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(saveMemoMock).toHaveBeenCalledWith("memo-1", "hello");
    expect(saveMemoMock).toHaveBeenCalledTimes(1);
  });

  it("resets the debounce timer on repeated calls, saving only the latest body", async () => {
    const { result } = renderHook(() => useAutoSave(1000));

    act(() => {
      result.current.save("memo-1", "first");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    act(() => {
      result.current.save("memo-1", "second");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(saveMemoMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(saveMemoMock).toHaveBeenCalledTimes(1);
    expect(saveMemoMock).toHaveBeenCalledWith("memo-1", "second");
  });

  it("flush() saves immediately and cancels the pending timer", async () => {
    const { result } = renderHook(() => useAutoSave(1000));

    act(() => {
      result.current.save("memo-1", "hello");
    });

    await act(async () => {
      await result.current.flush();
    });

    expect(saveMemoMock).toHaveBeenCalledWith("memo-1", "hello");
    expect(saveMemoMock).toHaveBeenCalledTimes(1);

    // Advancing time afterward should not trigger a second save.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(saveMemoMock).toHaveBeenCalledTimes(1);
  });

  it("flush() is a no-op when there is nothing pending", async () => {
    const { result } = renderHook(() => useAutoSave(1000));

    await act(async () => {
      await result.current.flush();
    });

    expect(saveMemoMock).not.toHaveBeenCalled();
  });
});
