import { tool } from "@opencode-ai/plugin";
import { renderSingleBlock } from "./index";

export default tool({
  description:
    "Render a Mermaid.js diagram as an inline SVG image visible in chat. " +
    "Use this tool INSTEAD of writing ```mermaid code blocks. " +
    "The result is a rendered diagram the user can see.",
  args: {
    code: tool.schema
      .string()
      .describe("Raw Mermaid.js source code with \\n for line breaks"),
  },
  async execute(args) {
    return { title: "Mermaid diagram", output: await renderSingleBlock(args.code) };
  },
});