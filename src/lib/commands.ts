import { invoke } from "@tauri-apps/api/core";
import type { Memo, MemoSummary } from "../types/memo";

export async function ensureMemoDir(): Promise<string> {
  return invoke<string>("ensure_memo_dir");
}

export async function listMemos(): Promise<MemoSummary[]> {
  return invoke<MemoSummary[]>("list_memos");
}

export async function loadMemo(id: string): Promise<Memo> {
  return invoke<Memo>("load_memo", { id });
}

export async function saveMemo(id: string, body: string): Promise<Memo> {
  return invoke<Memo>("save_memo", { id, body });
}

export async function createMemo(): Promise<Memo> {
  return invoke<Memo>("create_memo");
}

export async function deleteMemo(id: string): Promise<void> {
  return invoke<void>("delete_memo", { id });
}
