import type { ReactNode } from "react";
import TitleBar from "./TitleBar";

interface Props {
  sidebar: ReactNode;
  editor: ReactNode;
}

export default function Layout({ sidebar, editor }: Props) {
  return (
    <div className="app-layout">
      <TitleBar />
      <div className="app-content">
        {sidebar}
        <div className="editor-pane">{editor}</div>
      </div>
    </div>
  );
}
