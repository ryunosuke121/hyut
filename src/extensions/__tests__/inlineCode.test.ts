import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";

function createEditor(content?: string) {
  return new Editor({
    extensions: [StarterKit.configure({ codeBlock: false })],
    content,
  });
}

/**
 * Simulate typing text character by character into the editor.
 * Input rules (like the backtick-to-code shortcut) are wired to the
 * EditorView's `handleTextInput` prop, which only fires on real DOM text
 * input events. `insertContent` bypasses it, so route each character
 * through `handleTextInput` directly, the same path the browser uses.
 */
function typeText(editor: Editor, text: string) {
  for (const char of text) {
    const { from, to } = editor.state.selection;
    const handled = editor.view.someProp("handleTextInput", (f) =>
      f(editor.view, from, to, char),
    );
    if (!handled) {
      editor.commands.insertContent(char);
    }
  }
}

describe("inline code input rule", () => {
  it("does not delete the character preceding the backtick shortcut", () => {
    const editor = createEditor("<p></p>");
    editor.commands.focus("end");
    typeText(editor, "a`code`");

    expect(editor.getText()).toBe("acode");
  });

  it("marks the wrapped text as code without touching earlier text", () => {
    const editor = createEditor("<p>hello</p>");
    editor.commands.focus("end");
    typeText(editor, " `world`");

    const doc = editor.getJSON();
    const paragraph = doc.content?.[0];
    const textNodes = paragraph?.content ?? [];
    const codeNode = textNodes.find((node) =>
      node.marks?.some((mark) => mark.type === "code"),
    );

    expect(editor.getText()).toBe("hello world");
    expect(codeNode?.text).toBe("world");
  });
});
