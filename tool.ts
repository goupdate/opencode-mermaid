import { tool } from "@opencode-ai/plugin";
import { renderMermaid } from "beautiful-mermaid";

export default tool({
  description:
    "Render a Mermaid.js diagram. Returns a base64 SVG data URL. " +
    "After calling this tool, you MUST embed the returned URL in your response as: " +
    "![Mermaid diagram](<returned URL>). This makes the diagram visible to the user.",
  args: {
    code: tool.schema
      .string()
      .describe("Raw Mermaid.js source code with \\n for line breaks"),
  },
  async execute(args) {
    try {
      const svg = await renderMermaid(args.code);
      const b64 = Buffer.from(svg, "utf-8").toString("base64");
      return `data:image/svg+xml;base64,${b64}`;
    } catch (err) {
      return `Failed to render: ${String(err)}`;
    }
  },
});