import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Typography from "@tiptap/extension-typography";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import { forwardRef, useImperativeHandle } from "react";
import { BulletToTaskList } from "../extensions/bulletToTaskList";
import "../styles/editor.css";

const lowlight = createLowlight(common);

interface EditorProps {
  content: string;
  onChange: (markdown: string) => void;
}

export interface EditorHandle {
  focus: () => void;
}

const Editor = forwardRef<EditorHandle, EditorProps>(
  ({ content, onChange }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          codeBlock: false,
        }),
        TaskList,
        TaskItem.configure({ nested: true }),
        CodeBlockLowlight.configure({ lowlight }),
        Link.configure({ openOnClick: false }),
        Image,
        Table.configure({ resizable: true }),
        TableRow,
        TableCell,
        TableHeader,
        Typography,
        BulletToTaskList,
        Markdown,
      ],
      content,
      contentType: "markdown",
      onUpdate: ({ editor }) => {
        onChange(editor.getMarkdown());
      },
    });

    useImperativeHandle(ref, () => ({
      focus: () => {
        editor?.commands.focus("end");
      },
    }));

    return (
      <div className="editor-wrapper">
        <EditorContent editor={editor} />
      </div>
    );
  },
);

Editor.displayName = "Editor";

export default Editor;
