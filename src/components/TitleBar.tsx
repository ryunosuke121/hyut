import type { ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

export default function TitleBar({ children }: Props) {
  return (
    <div className="titlebar" data-tauri-drag-region>
      {children}
    </div>
  );
}
