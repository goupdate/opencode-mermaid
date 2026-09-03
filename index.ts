import type { Plugin } from "@opencode-ai/plugin";
import { renderMermaid } from "beautiful-mermaid";

// ─── Constants ──────────────────────────────────────────────────────────────

/** Matches ```mermaid\n...\n``` blocks. Captures diagram source without fences. */
const MERMAID_BLOCK_RE = /```mermaid\r?\n([\s\S]*?)```/g;

/** Maximum data-URL length before falling back to HTML <img> tag. */
const MAX_DATA_URL = 100_000;

// ─── Plugin ─────────────────────────────────────────────────────────────────

export const MermaidInlinePlugin: Plugin = async () => {
  return {
    // Inject system prompt so the AI knows it can use mermaid blocks
    "experimental.chat.system.transform": async (_input, output) => {
      output.system.push(
        "You can include Mermaid diagrams in your responses using ```mermaid code blocks. " +
          "The plugin will automatically render them as inline SVG images. " +
          "Supported types: flowchart (graph TD/LR/RL/BT), sequenceDiagram, " +
          "classDiagram, stateDiagram-v2, erDiagram. " +
          "NOT supported: pie, gantt, mindmap, timeline, gitGraph — use flowchart instead for those. " +
          "Example:\n" +
          '```mermaid\n' +
          "graph TD\n" +
          "  A[Client] --> B[Server]\n" +
          "  B --> C[(Database)]\n" +
          "```",
      );
    },

    // Intercept text completions and render mermaid blocks to inline SVG
    "experimental.text.complete": async (_input, output) => {
      if (typeof output.text !== "string") return;
      output.text = await renderAllBlocks(output.text);
    },
  };
};

// ─── Public API (exported for testing) ──────────────────────────────────────

/**
 * Scan text for mermaid code blocks and replace each with an inline SVG
 * image followed by a collapsible source view.
 */
export async function renderAllBlocks(text: string): Promise<string> {
  // Collect all mermaid blocks with their positions
  const blocks: { match: string; code: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = MERMAID_BLOCK_RE.exec(text)) !== null) {
    blocks.push({ match: m[0], code: m[1].trim() });
  }

  if (blocks.length === 0) return text;

  // Render all diagrams in parallel
  const rendered = await Promise.all(
    blocks.map((b) => renderSingleBlock(b.code)),
  );

  // Replace each block with its rendered output
  let result = text;
  // Reset regex and iterate again in order
  MERMAID_BLOCK_RE.lastIndex = 0;
  let i = 0;
  result = text.replace(MERMAID_BLOCK_RE, () => rendered[i++]);

  return result;
}

/**
 * Render a single mermaid diagram to an inline markdown block.
 *
 * Output:
 *   1. SVG embedded as base64 data-URL image (visible immediately)
 *   2. `<details>` block with original source (click to reveal)
 *
 * On render failure the original ```mermaid block is preserved unchanged.
 */
export async function renderSingleBlock(code: string): Promise<string> {
  try {
    const svg = await renderMermaid(code);
    const image = svgToImage(svg);

    const escaped = escapeHtml(code);

    const source = [
      "<details>",
      "<summary>📝 Mermaid source</summary>",
      "",
      "<pre>" + escaped + "</pre>",
      "</details>",
    ].join("\n");

    return image + "\n\n" + source;
  } catch {
    // Keep original block on render failure
    return "```mermaid\n" + code + "\n```";
  }
}

/**
 * Convert an SVG string to a markdown image with a base64 data URL.
 */
export function svgToImage(svg: string): string {
  const b64 = Buffer.from(svg, "utf-8").toString("base64");
  const dataUrl = `data:image/svg+xml;base64,${b64}`;

  if (dataUrl.length > MAX_DATA_URL) {
    return `<img alt="Mermaid diagram" src="${dataUrl}" />`;
  }

  return `![Mermaid diagram](${dataUrl})`;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Default export for OpenCode plugin system
export default MermaidInlinePlugin;