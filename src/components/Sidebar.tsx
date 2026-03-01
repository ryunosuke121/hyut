import type { MemoSummary } from "../types/memo";
import MemoListItem from "./MemoListItem";

interface Props {
  memos: MemoSummary[];
  currentMemoId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export default function Sidebar({
  memos,
  currentMemoId,
  onSelect,
  onCreate,
  onDelete,
}: Props) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Memos</span>
        <button
          type="button"
          className="sidebar-new-btn"
          onClick={onCreate}
          title="New memo (⌘N)"
        >
          +
        </button>
      </div>
      <div className="sidebar-list">
        {memos.length === 0 ? (
          <div className="sidebar-empty">No memos yet</div>
        ) : (
          memos.map((memo) => (
            <MemoListItem
              key={memo.id}
              memo={memo}
              isActive={memo.id === currentMemoId}
              onClick={() => onSelect(memo.id)}
              onDelete={() => onDelete(memo.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
