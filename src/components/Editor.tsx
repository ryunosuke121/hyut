import { Extension, InputRule } from "@tiptap/core";
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
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import { forwardRef, useImperativeHandle } from "react";
import "../styles/editor.css";

const TaskListInputRule = Extension.create({
  name: "taskListInputRule",
  addInputRules() {
    return [
      new InputRule({
        find: /^\[([( |x])?\]\s$/,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const checked = match[1] === "x";
          const $from = state.doc.resolve(range.from);

          const listItem = $from.node(-1);
          const list = $from.node(-2);
          if (
            !listItem ||
            !list ||
            (list.type.name !== "bulletList" &&
              list.type.name !== "orderedList")
          ) {
            return;
          }

          const taskListType = state.schema.nodes.taskList;
          const taskItemType = state.schema.nodes.taskItem;
          if (!taskListType || !taskItemType) return;

          tr.deleteRange(range.from, range.to);

          const listPos = $from.before(-2);
          const listItemContent = listItem.content.cut(0);
          const taskItem = taskItemType.create({ checked }, listItemContent);
          const taskList = taskListType.create(null, taskItem);

          tr.replaceWith(listPos, listPos + list.nodeSize, taskList);
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
        TaskListInputRule,
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
