import type { MemoSummary } from "../types/memo";

interface Props {
  memo: MemoSummary;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function MemoListItem({
  memo,
  isActive,
  onClick,
  onDelete,
}: Props) {
  return (
    <div
      className={`memo-list-item ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      <div className="memo-list-item-title">
        {memo.title || "Untitled"}
      </div>
      <div className="memo-list-item-meta">
        <span className="memo-list-item-time">
          {relativeTime(memo.updated_at)}
        </span>
        <button
          className="memo-list-item-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete memo"
        >
          ×
        </button>
      </div>
    </div>
  );
}
