import { describe, expect, it } from "bun:test";
import { renderSingleBlock, renderAllBlocks, svgToImage } from "./index";
import tool from "./tool";

// ─── svgToImage ─────────────────────────────────────────────────────────────

describe("svgToImage", () => {
  it("produces a markdown image with base64 data URL for small SVGs", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';
    const result = svgToImage(svg);

    expect(result).toStartWith("![Mermaid diagram](data:image/svg+xml;base64,");
    expect(result).toEndWith(")");
  });

  it("returns valid base64 that decodes back to original SVG", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="5"/></svg>';
    const result = svgToImage(svg);

    const b64 = result.slice(
      "![Mermaid diagram](data:image/svg+xml;base64,".length,
      -1,
    );
    const decoded = Buffer.from(b64, "base64").toString("utf-8");
    expect(decoded).toBe(svg);
  });

  it("handles non-ASCII (Cyrillic) characters in the SVG", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg">Клиент</svg>';
    const result = svgToImage(svg);

    const b64 = result.slice(
      "![Mermaid diagram](data:image/svg+xml;base64,".length,
      -1,
    );
    const decoded = Buffer.from(b64, "base64").toString("utf-8");
    expect(decoded).toBe(svg);
  });
});

// ─── renderSingleBlock ──────────────────────────────────────────────────────

describe("renderSingleBlock", () => {
  it("renders a flowchart to SVG image + source details", async () => {
    const result = await renderSingleBlock("graph TD\n  A --> B");

    expect(result).toContain("![Mermaid diagram](data:image/svg+xml;base64,");
    expect(result).toContain("<details>");
    expect(result).toContain("<summary>📝 Mermaid source</summary>");
    expect(result).toContain("<pre>");
    expect(result).toContain("</pre>");
    expect(result).toContain("</details>");
    expect(result).toContain("graph TD");
  });

  it("renders a sequence diagram", async () => {
    const result = await renderSingleBlock(
      "sequenceDiagram\n  Alice->>Bob: Hello",
    );
    expect(result).toContain("![Mermaid diagram](data:image/svg+xml;base64,");
    expect(result).toContain("Alice-&gt;&gt;Bob");
  });

  it("renders a class diagram", async () => {
    const result = await renderSingleBlock(
      "classDiagram\n  class Animal {\n    +run()\n  }",
    );
    expect(result).toContain("![Mermaid diagram]");
  });

  it("renders an ER diagram", async () => {
    const result = await renderSingleBlock(
      "erDiagram\n  CUSTOMER ||--o{ ORDER : places",
    );
    expect(result).toContain("![Mermaid diagram]");
  });

  it("renders a state diagram", async () => {
    const result = await renderSingleBlock(
      "stateDiagram-v2\n  [*] --> Active\n  Active --> [*]",
    );
    expect(result).toContain("![Mermaid diagram]");
  });

  it("falls back for pie charts (unsupported in beautiful-mermaid v0.1)", async () => {
    const code = 'pie\n  "Dogs" : 40\n  "Cats" : 60';
    const result = await renderSingleBlock(code);
    // v0.1.3 doesn't support pie — falls back to original block
    expect(result).toContain("```mermaid");
  });

  it("falls back for gantt charts (unsupported in beautiful-mermaid v0.1)", async () => {
    const code = "gantt\n  title My Project\n  dateFormat YYYY-MM-DD\n  section A\n  Task1 :a1, 2024-01-01, 30d";
    const result = await renderSingleBlock(code);
    // v0.1.3 doesn't support gantt — falls back to original block
    expect(result).toContain("```mermaid");
  });

  it("falls back to original block on invalid syntax", async () => {
    const code = "this is not valid mermaid at all";
    const result = await renderSingleBlock(code);
    expect(result).toBe("```mermaid\n" + code + "\n```");
    expect(result).not.toContain("![Mermaid diagram]");
  });

  it("escapes HTML in source view", async () => {
    const result = await renderSingleBlock(
      "graph TD\n  A -->|<script>| B",
    );
    expect(result).toContain("&lt;script&gt;");
    expect(result).not.toContain("<script>");
  });

  it("escapes ampersands in source view", async () => {
    const result = await renderSingleBlock("graph TD\n  A -->|a & b| B");
    expect(result).toContain("a &amp; b");
  });
});

// ─── renderAllBlocks ────────────────────────────────────────────────────────

describe("renderAllBlocks", () => {
  it("replaces a single mermaid block in text", async () => {
    const input =
      "Here is a diagram:\n\n```mermaid\ngraph TD\n  A --> B\n```\n\nMore text.";
    const result = await renderAllBlocks(input);

    expect(result).not.toContain("```mermaid");
    expect(result).toContain("![Mermaid diagram]");
    expect(result).toContain("<details>");
    expect(result).toContain("Here is a diagram:");
    expect(result).toContain("More text.");
  });

  it("replaces multiple mermaid blocks", async () => {
    const input = [
      "```mermaid",
      "graph TD",
      "  A --> B",
      "```",
      "",
      "Some text",
      "",
      "```mermaid",
      "sequenceDiagram",
      "  Alice->>Bob: Hi",
      "```",
    ].join("\n");

    const result = await renderAllBlocks(input);

    const imageMatches = [...result.matchAll(/!\[Mermaid diagram\]/g)];
    expect(imageMatches.length).toBe(2);

    const detailsMatches = [...result.matchAll(/<details>/g)];
    expect(detailsMatches.length).toBe(2);
  });

  it("passes through text without mermaid blocks unchanged", async () => {
    const input =
      "Just some text with `code` and **bold**.\n\n```typescript\nconst x = 1;\n```";
    const result = await renderAllBlocks(input);
    expect(result).toBe(input);
  });

  it("does not affect non-mermaid code blocks", async () => {
    const input = [
      "```typescript",
      "const x: number = 42;",
      "```",
      "",
      "```mermaid",
      "graph TD",
      "  A --> B",
      "```",
      "",
      "```python",
      "print('hello')",
      "```",
    ].join("\n");

    const result = await renderAllBlocks(input);

    expect(result).toContain("```typescript");
    expect(result).toContain("const x: number = 42;");
    expect(result).toContain("```python");
    expect(result).toContain("print('hello')");
    expect(result).not.toContain("```mermaid");
  });

  it("handles mixed valid and invalid mermaid blocks", async () => {
    const input = [
      "```mermaid",
      "graph TD",
      "  A --> B",
      "```",
      "",
      "```mermaid",
      "not valid syntax !!!",
      "```",
    ].join("\n");

    const result = await renderAllBlocks(input);
    expect(result).toContain("![Mermaid diagram]");
    expect(result).toContain("```mermaid");
  });

  it("handles Windows line endings (CRLF)", async () => {
    const input = "```mermaid\r\ngraph TD\r\n  A --> B\r\n```";
    const result = await renderAllBlocks(input);
    expect(result).toContain("![Mermaid diagram]");
  });
});

// ─── Edge cases ─────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("handles empty mermaid block", async () => {
    const result = await renderAllBlocks("```mermaid\n```");
    expect(result).toContain("```");
  });

  it("handles whitespace-only mermaid block", async () => {
    const result = await renderAllBlocks("```mermaid\n   \n```");
    expect(result).toContain("```");
  });

  it("falls back to original for comment-only blocks (unsupported in v0.1)", async () => {
    const result = await renderAllBlocks("```mermaid\n%% just a comment\n```");
    // v0.1 treats comment-only as invalid — falls back to original
    expect(result).toContain("```mermaid");
  });
});

// ─── Integration tests ──────────────────────────────────────────────────────

describe("integration", () => {
  it("renders a full conversation snippet with mermaid in the middle", async () => {
    const input = [
      "I'll design the architecture for you.",
      "",
      "```mermaid",
      "graph TD",
      "  A[Client] --> B[API]",
      "  B --> C[(Database)]",
      "```",
      "",
      "The client communicates with the API which persists to the database.",
    ].join("\n");

    const result = await renderAllBlocks(input);

    expect(result).not.toContain("```mermaid");
    expect(result).toContain("![Mermaid diagram](data:image/svg+xml;base64,");
    expect(result).toContain("Client");
    expect(result).toContain("Database");
    expect(result).toContain("I'll design the architecture");
    expect(result).toContain("The client communicates");
  });

  it("produces a complete snippet with valid HTML <details> structure", async () => {
    const result = await renderSingleBlock("graph TD\n  A --> B");
    const lines = result.split("\n");

    expect(lines[0]).toStartWith("![Mermaid diagram]");

    const detailsOpen = lines.findIndex((l) => l.trim() === "<details>");
    const detailsClose = lines.findIndex((l) => l.trim() === "</details>");
expect(detailsOpen).toBeGreaterThan(0);
  expect(detailsClose).toBeGreaterThan(detailsOpen);
  });
});

// ─── Tool tests ──────────────────────────────────────────────────────────────

describe("tool", () => {
  it("has description and args", () => {
    expect(tool.description).toBeString();
    expect(tool.args).toHaveProperty("code");
  });

  it("execute returns a base64 data URL for valid mermaid", async () => {
    const output = await tool.execute({ code: "graph TD\n  A --> B" }, {} as any);
    expect(output).toStartWith("data:image/svg+xml;base64,");
    // verify it's valid base64 by decoding
    const b64 = output.slice("data:image/svg+xml;base64,".length);
    const decoded = Buffer.from(b64, "base64").toString("utf-8");
    expect(decoded).toStartWith("<svg");
    expect(decoded).toContain("</svg>");
  });

  it("execute handles invalid mermaid gracefully", async () => {
    const output = await tool.execute({ code: "not valid syntax !!!@@@" }, {} as any);
    expect(output).toStartWith("Failed to render:");
  });

  it("produces a URL that works as a markdown image", async () => {
    const url = await tool.execute({ code: "graph TD\n  A[Tester] --> B[Works]" }, {} as any);
    expect(url).toStartWith("data:image/svg+xml;base64,");
    const mdImage = `![diagram](${url})`;
    expect(mdImage).toStartWith("![diagram](data:image/svg+xml;base64,");
  });
});