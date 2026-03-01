import { useCallback, useEffect, useState } from "react";
import {
  createMemo as createMemoCmd,
  deleteMemo as deleteMemoCmd,
  ensureMemoDir,
  listMemos,
  loadMemo,
} from "../lib/commands";
import { extractTitle } from "../lib/frontmatter";
import type { Memo, MemoSummary } from "../types/memo";

export function useMemos() {
  const [memos, setMemos] = useState<MemoSummary[]>([]);
  const [currentMemo, setCurrentMemo] = useState<Memo | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshList = useCallback(async () => {
    const list = await listMemos();
    setMemos(list);
    return list;
  }, []);

  const initialize = useCallback(async () => {
    await ensureMemoDir();
    await refreshList();
    setLoading(false);
  }, [refreshList]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const selectMemo = useCallback(async (id: string) => {
    const memo = await loadMemo(id);
    setCurrentMemo(memo);
  }, []);

  const createNew = useCallback(async () => {
    const memo = await createMemoCmd();
    setCurrentMemo(memo);
    await refreshList();
    return memo;
  }, [refreshList]);

  const remove = useCallback(
    async (id: string) => {
      await deleteMemoCmd(id);
      if (currentMemo?.meta.id === id) {
        setCurrentMemo(null);
      }
      await refreshList();
    },
    [currentMemo, refreshList],
  );

  const updateCurrentBody = useCallback(
    (body: string) => {
      if (!currentMemo) return;
      setCurrentMemo((prev) => (prev ? { ...prev, body } : null));
      const title = extractTitle(body);
      setMemos((prev) =>
        prev.map((m) =>
          m.id === currentMemo.meta.id
            ? { ...m, title, updated_at: new Date().toISOString() }
            : m,
        ),
      );
    },
    [currentMemo],
  );

  return {
    memos,
    currentMemo,
    loading,
    selectMemo,
    createNew,
    remove,
    updateCurrentBody,
    refreshList,
  };
}
