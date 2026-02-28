export interface MemoMeta {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface Memo {
  meta: MemoMeta;
  body: string;
}

export interface MemoSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}
