// Tiptap's markdown serializer renders an empty paragraph as a literal
// "&nbsp;" (or a raw NBSP char) to preserve blank lines, so a blank
// first line isn't actually an empty string here.
function isBlankLine(line: string): boolean {
  return line.replace(/&nbsp;| /gi, "").trim().length === 0;
}

export function extractTitle(markdown: string): string {
  for (const line of markdown.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      return trimmed.slice(2).trim();
    }
    if (!isBlankLine(trimmed)) {
      return trimmed.slice(0, 50);
    }
  }
  return "Untitled";
}
