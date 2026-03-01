import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useRef, useState } from "react";
import ConfirmDialog from "./components/ConfirmDialog";
import Editor, { type EditorHandle } from "./components/Editor";
import Layout from "./components/Layout";
import Sidebar from "./components/Sidebar";
import { useAppState } from "./hooks/useAppState";
import { useAutoSave } from "./hooks/useAutoSave";
import { useMemos } from "./hooks/useMemos";
import "./App.css";

function App() {
  const {
    memos,
    currentMemo,
    loading,
    selectMemo,
    createNew,
    remove,
    updateCurrentBody,
  } = useMemos();
  const { save, flush } = useAutoSave();
  const { lastMemoId, setLastMemoId } = useAppState();
  const editorRef = useRef<EditorHandle>(null);
  const initializedRef = useRef(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Restore last memo on load
  useEffect(() => {
    if (!loading && !initializedRef.current) {
      initializedRef.current = true;
      if (lastMemoId && memos.some((m) => m.id === lastMemoId)) {
        selectMemo(lastMemoId);
      } else if (memos.length > 0) {
        selectMemo(memos[0].id);
      }
    }
  }, [loading, memos, lastMemoId, selectMemo]);

  // Track current memo in app state
  useEffect(() => {
    if (currentMemo) {
      setLastMemoId(currentMemo.meta.id);
    }
  }, [currentMemo, setLastMemoId]);

  const handleCreate = useCallback(async () => {
    await flush();
    await createNew();
    setTimeout(() => editorRef.current?.focus(), 50);
  }, [flush, createNew]);

  // Esc to hide, Cmd+N for new memo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        getCurrentWindow().hide();
      }
      if (e.key === "n" && e.metaKey) {
        e.preventDefault();
        handleCreate();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCreate]);

  // Hide on blur + focus editor on window focus
  useEffect(() => {
    const appWindow = getCurrentWindow();
    const unlisten = appWindow.onFocusChanged(({ payload: focused }) => {
      if (focused) {
        setTimeout(() => editorRef.current?.focus(), 50);
      } else {
        appWindow.hide();
      }
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleSelect = useCallback(
    async (id: string) => {
      await flush();
      await selectMemo(id);
    },
    [flush, selectMemo],
  );

  const handleDeleteRequest = useCallback((id: string) => {
    setPendingDeleteId(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (pendingDeleteId) {
      await remove(pendingDeleteId);
      setPendingDeleteId(null);
    }
  }, [pendingDeleteId, remove]);

  const handleDeleteCancel = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  const handleEditorChange = useCallback(
    (markdown: string) => {
      if (!currentMemo) return;
      updateCurrentBody(markdown);
      save(currentMemo.meta.id, markdown);
    },
    [currentMemo, updateCurrentBody, save],
  );

  if (loading) {
    return <div className="app-loading">Loading...</div>;
  }

  return (
    <>
      <Layout
        sidebar={
          <Sidebar
            memos={memos}
            currentMemoId={currentMemo?.meta.id ?? null}
            onSelect={handleSelect}
            onCreate={handleCreate}
            onDelete={handleDeleteRequest}
          />
        }
        editor={
          currentMemo ? (
            <Editor
              key={currentMemo.meta.id}
              ref={editorRef}
              content={currentMemo.body}
              onChange={handleEditorChange}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-state-text">
                Create a new memo to get started
              </div>
              <button
                type="button"
                className="empty-state-btn"
                onClick={handleCreate}
              >
                New Memo
              </button>
            </div>
          )
        }
      />
      {pendingDeleteId && (
        <ConfirmDialog
          message="Are you sure you want to delete this memo?"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </>
  );
}

export default App;
