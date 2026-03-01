import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";

/**
 * Converts a bullet/ordered list item to a task list item when the user
 * types `[ ] ` or `[x] ` at the beginning of a list item.
 *
 * Uses appendTransaction instead of InputRule for reliable detection
 * regardless of typing speed.
 */
export const BulletToTaskList = Extension.create({
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
