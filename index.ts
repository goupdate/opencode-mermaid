import { type Plugin, tool } from "@opencode-ai/plugin";
import { renderMermaid } from "beautiful-mermaid";

const MERMAID_BLOCK_RE = /```mermaid\r?\n([\s\S]*?)```/g;

const SYSTEM_PROMPT = [
  "IMPORTANT Mermaid rendering instructions:",
  "You have a render_mermaid tool available. Use it to display diagrams.",
  "NEVER output raw ```mermaid code blocks in your response.",
  "Instead, call the render_mermaid tool with the raw Mermaid source as the 'code' argument.",
  "Example: render_mermaid({code: 'graph TD\\n  A --> B'})",
  "Supported types: flowchart (graph TD/LR/RL/BT), sequenceDiagram,",
  "classDiagram, stateDiagram-v2, erDiagram.",
  "NOT supported: pie, gantt, mindmap, timeline, gitGraph.",
  "The tool returns a rendered SVG diagram visible in chat.",
].join("\n");

export const MermaidInlinePlugin: Plugin = async () => {
  return {
    "experimental.chat.system.transform": async (_input, output) => {
      output.system.push(SYSTEM_PROMPT);
    },

    tool: {
      render_mermaid: tool({
        description:
          "Render a Mermaid.js diagram as an inline SVG image visible in chat. " +
          "Call this tool INSTEAD of writing ```mermaid code blocks. " +
          "The result is a rendered diagram the user can see.",
        args: {
          code: tool.schema
            .string()
            .describe("Raw Mermaid.js source code with \\n for line breaks"),
        },
        async execute(args) {
          const result = await renderSingleBlock(args.code);
          return { title: "Mermaid diagram", output: result };
        },
      }),
    },
  };
};

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

export { tool };
export default MermaidInlinePlugin;