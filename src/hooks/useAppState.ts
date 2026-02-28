import { useState, useCallback, useEffect } from "react";

interface AppState {
  lastMemoId: string | null;
}

const STORAGE_KEY = "hyut-app-state";

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { lastMemoId: null };
}

function persistState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useAppState() {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    persistState(state);
  }, [state]);

  const setLastMemoId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, lastMemoId: id }));
  }, []);

  return {
    lastMemoId: state.lastMemoId,
    setLastMemoId,
  };
}
