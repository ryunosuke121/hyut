import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Memo } from "../../types/memo";

const ensureMemoDirMock = vi.hoisted(() => vi.fn());
const listMemosMock = vi.hoisted(() => vi.fn());
const loadMemoMock = vi.hoisted(() => vi.fn());
const createMemoMock = vi.hoisted(() => vi.fn());
const deleteMemoMock = vi.hoisted(() => vi.fn());

vi.mock("../../lib/commands", () => ({
  ensureMemoDir: ensureMemoDirMock,
  listMemos: listMemosMock,
  loadMemo: loadMemoMock,
  createMemo: createMemoMock,
  deleteMemo: deleteMemoMock,
}));

import { useMemos } from "../useMemos";

const summary1 = {
  id: "1",
  title: "First",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
};
const summary2 = {
  id: "2",
  title: "Second",
  created_at: "2024-01-02T00:00:00.000Z",
  updated_at: "2024-01-02T00:00:00.000Z",
};

describe("useMemos", () => {
  beforeEach(() => {
    ensureMemoDirMock.mockReset().mockResolvedValue("/home/user/hyut");
    listMemosMock.mockReset().mockResolvedValue([summary1, summary2]);
    loadMemoMock.mockReset();
    createMemoMock.mockReset();
    deleteMemoMock.mockReset().mockResolvedValue(undefined);
  });

  it("initializes by ensuring the memo dir and loading the list", async () => {
    const { result } = renderHook(() => useMemos());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(ensureMemoDirMock).toHaveBeenCalledTimes(1);
    expect(result.current.memos).toEqual([summary1, summary2]);
  });

  it("selectMemo loads a memo and sets it as current", async () => {
    const memo = {
      meta: { id: "1", created_at: "t", updated_at: "t" },
      body: "content",
    };
    loadMemoMock.mockResolvedValue(memo);

    const { result } = renderHook(() => useMemos());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.selectMemo("1");
    });

    expect(loadMemoMock).toHaveBeenCalledWith("1");
    expect(result.current.currentMemo).toEqual(memo);
  });

  it("createNew creates a memo, sets it current, and refreshes the list", async () => {
    const newMemo = {
      meta: { id: "3", created_at: "t", updated_at: "t" },
      body: "",
    };
    createMemoMock.mockResolvedValue(newMemo);

    const { result } = renderHook(() => useMemos());
    await waitFor(() => expect(result.current.loading).toBe(false));

    listMemosMock.mockResolvedValue([summary1, summary2, newMemo]);

    let created: Memo | undefined;
    await act(async () => {
      created = await result.current.createNew();
    });

    expect(created).toEqual(newMemo);
    expect(result.current.currentMemo).toEqual(newMemo);
    expect(listMemosMock).toHaveBeenCalledTimes(2);
  });

  it("remove deletes the memo, clears currentMemo if it was selected, and refreshes", async () => {
    const memo = {
      meta: { id: "1", created_at: "t", updated_at: "t" },
      body: "content",
    };
    loadMemoMock.mockResolvedValue(memo);

    const { result } = renderHook(() => useMemos());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.selectMemo("1");
    });
    expect(result.current.currentMemo).toEqual(memo);

    listMemosMock.mockResolvedValue([summary2]);

    await act(async () => {
      await result.current.remove("1");
    });

    expect(deleteMemoMock).toHaveBeenCalledWith("1");
    expect(result.current.currentMemo).toBeNull();
    expect(result.current.memos).toEqual([summary2]);
  });

  it("remove does not clear currentMemo when a different memo is deleted", async () => {
    const memo = {
      meta: { id: "1", created_at: "t", updated_at: "t" },
      body: "content",
    };
    loadMemoMock.mockResolvedValue(memo);

    const { result } = renderHook(() => useMemos());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.selectMemo("1");
    });

    await act(async () => {
      await result.current.remove("2");
    });

    expect(deleteMemoMock).toHaveBeenCalledWith("2");
    expect(result.current.currentMemo).toEqual(memo);
  });

  it("updateCurrentBody updates the body, title, and re-sorts the memo list", async () => {
    const memo = {
      meta: { id: "1", created_at: "t", updated_at: "t" },
      body: "old body",
    };
    loadMemoMock.mockResolvedValue(memo);

    const { result } = renderHook(() => useMemos());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.selectMemo("1");
    });

    act(() => {
      result.current.updateCurrentBody("# New Title\nsome text");
    });

    expect(result.current.currentMemo?.body).toBe("# New Title\nsome text");
    const updated = result.current.memos.find((m) => m.id === "1");
    expect(updated?.title).toBe("New Title");
    // Updated memo should now be sorted first (most recently updated).
    expect(result.current.memos[0].id).toBe("1");
  });

  it("updateCurrentBody is a no-op when there is no current memo", async () => {
    const { result } = renderHook(() => useMemos());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.updateCurrentBody("some text");
    });

    expect(result.current.currentMemo).toBeNull();
  });
});
