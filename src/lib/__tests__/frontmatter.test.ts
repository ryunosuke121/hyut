import { describe, expect, it } from "vitest";
import { extractTitle } from "../frontmatter";

describe("extractTitle", () => {
  it("uses the H1 heading as the title", () => {
    expect(extractTitle("# Hello World\nsome body text")).toBe("Hello World");
  });

  it("trims whitespace around the H1 heading", () => {
    expect(extractTitle("#   Padded Title   \nbody")).toBe("Padded Title");
  });

  it("falls back to the first non-blank line when there is no H1", () => {
    expect(extractTitle("just a plain line\nsecond line")).toBe(
      "just a plain line",
    );
  });

  it("skips leading blank lines before picking a title", () => {
    expect(extractTitle("\n\n  \nActual content here")).toBe(
      "Actual content here",
    );
  });

  it("skips lines that are only &nbsp; placeholders", () => {
    expect(extractTitle("&nbsp;\n&nbsp;\nReal title")).toBe("Real title");
  });

  it("truncates a long first line to 50 characters", () => {
    const long = "a".repeat(80);
    const result = extractTitle(long);
    expect(result).toBe("a".repeat(50));
    expect(result.length).toBe(50);
  });

  it("returns Untitled for an empty string", () => {
    expect(extractTitle("")).toBe("Untitled");
  });

  it("returns Untitled when the markdown is entirely blank lines", () => {
    expect(extractTitle("\n \n&nbsp;\n")).toBe("Untitled");
  });

  it("does not treat a heading level other than H1 as a title", () => {
    expect(extractTitle("## Not an H1\nfallback text")).toBe("## Not an H1");
  });
});
