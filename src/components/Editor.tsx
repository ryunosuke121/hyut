import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { Markdown } from "@tiptap/markdown";
import { common, createLowlight } from "lowlight";
import { useImperativeHandle, forwardRef } from "react";
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
        Placeholder.configure({
          placeholder: "Start writing...",
        }),
        Typography,
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
  }
);

Editor.displayName = "Editor";

export default Editor;
