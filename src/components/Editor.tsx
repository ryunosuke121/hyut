import { Extension } from "@tiptap/core";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Typography from "@tiptap/extension-typography";
import { Markdown } from "@tiptap/markdown";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import { forwardRef, useImperativeHandle } from "react";
import "../styles/editor.css";

/**
 * Converts a bullet/ordered list item to a task list item when the user
 * types `[ ] ` or `[x] ` at the beginning of a list item.
 *
 * Uses appendTransaction instead of InputRule for reliable detection
 * regardless of typing speed.
 */
const BulletToTaskList = Extension.create({
  name: "bulletToTaskList",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("bulletToTaskList"),
        appendTransaction(transactions, _oldState, newState) {
          if (!transactions.some((tr) => tr.docChanged)) return null;

          const { $from } = newState.selection;
          if ($from.depth < 3) return null;

          const paragraph = $from.parent;
          if (paragraph.type.name !== "paragraph") return null;

          const text = paragraph.textContent;
          const match = text.match(/^\[( |x)?\] $/);
          if (!match) return null;
          if ($from.parentOffset !== text.length) return null;

          const listItem = $from.node($from.depth - 1);
          const list = $from.node($from.depth - 2);
          if (listItem.type.name !== "listItem") return null;
          if (
            list.type.name !== "bulletList" &&
            list.type.name !== "orderedList"
          )
            return null;
          if (list.childCount !== 1) return null;

          const checked = match[1] === "x";
          const {
            taskList: taskListType,
            taskItem: taskItemType,
            paragraph: paragraphType,
          } = newState.schema.nodes;
          if (!taskListType || !taskItemType) return null;

          const listPos = $from.before($from.depth - 2);
          const taskItem = taskItemType.create(
            { checked },
            paragraphType.create(),
          );
          const taskList = taskListType.create(null, taskItem);

          const tr = newState.tr;
          tr.replaceWith(listPos, listPos + list.nodeSize, taskList);
          tr.setSelection(TextSelection.create(tr.doc, listPos + 3));
          return tr;
        },
      }),
    ];
  },
});

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
