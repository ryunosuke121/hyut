import { Editor } from "@tiptap/core";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";
import { BulletToTaskList } from "../bulletToTaskList";

function createEditor(content?: string) {
  return new Editor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      BulletToTaskList,
    ],
    content,
  });
}

/**
 * Simulate typing text character by character into the editor.
 * This triggers appendTransaction for each character, matching real user input.
 */
function typeText(editor: Editor, text: string) {
  for (const char of text) {
    editor.commands.insertContent(char);
  }
}

describe("BulletToTaskList", () => {
  it("converts `[ ] ` in a bullet list to an unchecked taskList", () => {
    const editor = createEditor("<ul><li><p></p></li></ul>");
    // Place cursor inside the list item
    editor.commands.focus("end");
    typeText(editor, "[ ] ");

    const doc = editor.getJSON();
    const firstChild = doc.content?.[0];
    expect(firstChild?.type).toBe("taskList");
    const taskItem = firstChild?.content?.[0];
    expect(taskItem?.type).toBe("taskItem");
    expect((taskItem as Record<string, unknown>)?.attrs).toHaveProperty(
      "checked",
      false,
    );
  });

  it("converts `[x] ` in a bullet list to a checked taskList", () => {
    const editor = createEditor("<ul><li><p></p></li></ul>");
    editor.commands.focus("end");
    typeText(editor, "[x] ");

    const doc = editor.getJSON();
    const firstChild = doc.content?.[0];
    expect(firstChild?.type).toBe("taskList");
    const taskItem = firstChild?.content?.[0];
    expect((taskItem as Record<string, unknown>)?.attrs).toHaveProperty(
      "checked",
      true,
    );
  });

  it("places cursor inside the taskItem after conversion", () => {
    const editor = createEditor("<ul><li><p></p></li></ul>");
    editor.commands.focus("end");
    typeText(editor, "[ ] ");

    const { $from } = editor.state.selection;
    // Cursor should be inside taskItem > paragraph
    let insideTaskItem = false;
    for (let d = $from.depth; d >= 0; d--) {
      if ($from.node(d).type.name === "taskItem") {
        insideTaskItem = true;
        break;
      }
    }
    expect(insideTaskItem).toBe(true);
  });

  it("does NOT convert when the bullet list has multiple items", () => {
    const editor = createEditor(
      "<ul><li><p>first</p></li><li><p></p></li></ul>",
    );
    editor.commands.focus("end");
    typeText(editor, "[ ] ");

    const doc = editor.getJSON();
    // Should remain a bulletList (not converted)
    const hasTaskList = doc.content?.some((n) => n.type === "taskList");
    expect(hasTaskList).toBe(false);
  });

  it("does NOT convert incomplete pattern `[ ]` without trailing space", () => {
    const editor = createEditor("<ul><li><p></p></li></ul>");
    editor.commands.focus("end");
    typeText(editor, "[ ]");

    const doc = editor.getJSON();
    const firstChild = doc.content?.[0];
    expect(firstChild?.type).toBe("bulletList");
  });

  it("does NOT convert invalid pattern `[y] `", () => {
    const editor = createEditor("<ul><li><p></p></li></ul>");
    editor.commands.focus("end");
    typeText(editor, "[y] ");

    const doc = editor.getJSON();
    const firstChild = doc.content?.[0];
    expect(firstChild?.type).toBe("bulletList");
  });
});
