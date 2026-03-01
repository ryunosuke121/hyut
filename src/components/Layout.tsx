import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import TitleBar from "./TitleBar";

const MIN_SIDEBAR_WIDTH = 180;
const MAX_SIDEBAR_WIDTH = 400;
const DEFAULT_SIDEBAR_WIDTH = 260;

interface Props {
  sidebar: ReactNode;
  editor: ReactNode;
}

export default function Layout({ sidebar, editor }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "\\" && e.metaKey) {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      startX.current = e.clientX;
      startWidth.current = sidebarWidth;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [sidebarWidth],
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX.current;
      const newWidth = Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(MIN_SIDEBAR_WIDTH, startWidth.current + delta),
      );
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="app-layout">
      <TitleBar>
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={() => setSidebarOpen((prev) => !prev)}
          title={sidebarOpen ? "Hide sidebar (⌘\\)" : "Show sidebar (⌘\\)"}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect
              x="1.5"
              y="2.5"
              width="13"
              height="11"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
            />
            <line
              x1="5.5"
              y1="2.5"
              x2="5.5"
              y2="13.5"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        </button>
      </TitleBar>
      <div className="app-content">
        <div
          className={`sidebar-container${sidebarOpen ? "" : " collapsed"}${isResizing ? " resizing" : ""}`}
          style={
            sidebarOpen
              ? { width: sidebarWidth, minWidth: sidebarWidth }
              : undefined
          }
        >
          {sidebar}
          {sidebarOpen && (
            <div
              role="separator"
              tabIndex={0}
              aria-valuenow={sidebarWidth}
              aria-valuemin={MIN_SIDEBAR_WIDTH}
              aria-valuemax={MAX_SIDEBAR_WIDTH}
              className="sidebar-resize-handle"
              onMouseDown={handleMouseDown}
            />
          )}
        </div>
        <div className="editor-pane">{editor}</div>
      </div>
    </div>
  );
}
