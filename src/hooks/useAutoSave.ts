import { useCallback, useEffect, useRef } from "react";
import { saveMemo } from "../lib/commands";

export function useAutoSave(delay = 1000) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ id: string; body: string } | null>(null);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingRef.current) {
      const { id, body } = pendingRef.current;
      pendingRef.current = null;
      await saveMemo(id, body);
    }
  }, []);

  const save = useCallback(
    (id: string, body: string) => {
      pendingRef.current = { id, body };
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(async () => {
        timerRef.current = null;
        if (pendingRef.current) {
          const { id, body } = pendingRef.current;
          pendingRef.current = null;
          await saveMemo(id, body);
        }
      }, delay);
    },
    [delay],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { save, flush };
}
