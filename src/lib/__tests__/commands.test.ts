import { beforeEach, describe, expect, it, vi } from "vitest";

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

import {
  createMemo,
  deleteMemo,
  ensureMemoDir,
  listMemos,
  loadMemo,
  saveMemo,
} from "../commands";

describe("commands", () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it("ensureMemoDir invokes ensure_memo_dir and returns the result", async () => {
    invokeMock.mockResolvedValue("/home/user/hyut");
    const result = await ensureMemoDir();
    expect(invokeMock).toHaveBeenCalledWith("ensure_memo_dir");
    expect(result).toBe("/home/user/hyut");
  });

  it("listMemos invokes list_memos and returns the result", async () => {
    const summaries = [
      { id: "1", title: "a", created_at: "t", updated_at: "t" },
    ];
    invokeMock.mockResolvedValue(summaries);
    const result = await listMemos();
    expect(invokeMock).toHaveBeenCalledWith("list_memos");
    expect(result).toBe(summaries);
  });

  it("loadMemo invokes load_memo with the given id", async () => {
    const memo = {
      meta: { id: "abc", created_at: "t", updated_at: "t" },
      body: "b",
    };
    invokeMock.mockResolvedValue(memo);
    const result = await loadMemo("abc");
    expect(invokeMock).toHaveBeenCalledWith("load_memo", { id: "abc" });
    expect(result).toBe(memo);
  });

  it("saveMemo invokes save_memo with id and body", async () => {
    const memo = {
      meta: { id: "abc", created_at: "t", updated_at: "t" },
      body: "new body",
    };
    invokeMock.mockResolvedValue(memo);
    const result = await saveMemo("abc", "new body");
    expect(invokeMock).toHaveBeenCalledWith("save_memo", {
      id: "abc",
      body: "new body",
    });
    expect(result).toBe(memo);
  });

  it("createMemo invokes create_memo and returns the result", async () => {
    const memo = {
      meta: { id: "new", created_at: "t", updated_at: "t" },
      body: "",
    };
    invokeMock.mockResolvedValue(memo);
    const result = await createMemo();
    expect(invokeMock).toHaveBeenCalledWith("create_memo");
    expect(result).toBe(memo);
  });

  it("deleteMemo invokes delete_memo with the given id", async () => {
    invokeMock.mockResolvedValue(undefined);
    await deleteMemo("abc");
    expect(invokeMock).toHaveBeenCalledWith("delete_memo", { id: "abc" });
  });
});
