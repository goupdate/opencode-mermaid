import { type Plugin, tool } from "@opencode-ai/plugin";
import { renderMermaid } from "beautiful-mermaid";

const MERMAID_BLOCK_RE = /```mermaid\r?\n([\s\S]*?)```/g;

// ─── Plugin ─────────────────────────────────────────────────────────────────

export const MermaidInlinePlugin: Plugin = async () => {
  return {
    "experimental.chat.system.transform": async (_input, output) => {
      output.system.push(
        "You can render Mermaid diagrams using the render_mermaid tool. " +
        "Call render_mermaid with valid Mermaid.js source code. " +
        "Supported: flowchart (graph TD/LR/RL/BT), sequenceDiagram, " +
        "classDiagram, stateDiagram-v2, erDiagram. " +
        "NOT supported: pie, gantt, mindmap, timeline, gitGraph — use flowchart instead. " +
        'Example call: render_mermaid({code: "graph TD\\n  A[Client] --> B[Server]\\n  B --> C[(Database)]"})'
      );
    },

    "experimental.text.complete": async (_input, output) => {
      if (typeof output.text !== "string") return;
      output.text = await renderAllBlocks(output.text);
    },

    tool: {
      render_mermaid: tool({
        description:
          "Render a Mermaid.js diagram to an inline SVG image. " +
          "Use this tool to display diagrams in chat. " +
          "Input raw Mermaid source code with \\n for line breaks. " +
          "Supported: flowchart, sequenceDiagram, classDiagram, stateDiagram-v2, erDiagram. " +
          "Not supported: pie, gantt, mindmap, timeline, gitGraph.",
        args: {
          code: tool.schema.string().describe("Raw Mermaid source code"),
        },
        async execute(args) {
          return renderSingleBlock(args.code);
        },
      }),
    },
  };
};

// ─── Public API (exported for testing) ──────────────────────────────────────

export type { Plugin, tool };

export async function renderAllBlocks(text: string): Promise<string> {
  const blocks: { match: string; code: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = MERMAID_BLOCK_RE.exec(text)) !== null) {
    blocks.push({ match: m[0], code: m[1].trim() });
  }
  if (blocks.length === 0) return text;

  const rendered = await Promise.all(blocks.map((b) => renderSingleBlock(b.code)));

  let i = 0;
  return text.replace(MERMAID_BLOCK_RE, () => rendered[i++]);
}

export async function renderSingleBlock(code: string): Promise<string> {
  try {
    const svg = await renderMermaid(code);
    const image = svgToImage(svg);
    const escaped = escapeHtml(code);
    return (
      image +
      "\n\n" +
      [
        "<details>",
        "<summary>📝 Mermaid source</summary>",
        "",
        "<pre>" + escaped + "</pre>",
        "</details>",
      ].join("\n")
    );
  } catch {
    return "```mermaid\n" + code + "\n```";
  }
}

export function svgToImage(svg: string): string {
  const b64 = Buffer.from(svg, "utf-8").toString("base64");
  return `![Mermaid diagram](data:image/svg+xml;base64,${b64})`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default MermaidInlinePlugin;