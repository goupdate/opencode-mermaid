# opencode-mermaid

OpenCode plugin — renders Mermaid diagrams **inline in chat** as SVG images via a custom tool. No external browser tab, no ASCII approximations.

The AI calls the `render_mermaid` tool and the diagram appears directly in the chat flow.

---

## Install

**Step 1 — install the package** into OpenCode's config directory:

```bash
# macOS / Linux
cd ~/.config/opencode && npm install @goupdate3/opencode-mermaid

# Windows
cd %USERPROFILE%\.config\opencode && npm install @goupdate3/opencode-mermaid
```

**Step 2 — create the custom tool file** in `~/.config/opencode/tools/render_mermaid.ts`:

```ts
export { default } from "@goupdate3/opencode-mermaid/tool";
```

**Step 3 — add the AI instruction** to `opencode.jsonc`:

```jsonc
{
  "instructions": [
    "You have a render_mermaid tool available. Use it to display ALL Mermaid diagrams. NEVER output raw ```mermaid code blocks. Instead, call the render_mermaid tool with the raw Mermaid source code as the 'code' argument. Example: render_mermaid({code: 'graph TD\\n  A --> B'}). Supported: flowchart, sequenceDiagram, classDiagram, stateDiagram-v2, erDiagram."
  ]
}
```

**Step 4 — restart OpenCode.**

---

## Usage

1. Start a conversation with the AI
2. Ask for a diagram — the AI calls `render_mermaid` tool
3. The tool renders the diagram as an **inline SVG image** with a collapsible source view

---

## Supported diagram types

| Type | Syntax | Status |
|---|---|---|
| Flowchart | `graph TD`, `flowchart LR`, etc. | ✅ |
| Sequence | `sequenceDiagram` | ✅ |
| Class | `classDiagram` | ✅ |
| State | `stateDiagram-v2` | ✅ |
| ER | `erDiagram` | ✅ |
| Pie | `pie` | ❌ |
| Gantt | `gantt` | ❌ |
| Mindmap | `mindmap` | ❌ |
| Timeline | `timeline` | ❌ |
| Git Graph | `gitGraph` | ❌ |

---

## How it works

```
AI calls render_mermaid tool with Mermaid source code
                │
                ▼
        tool.ts imports renderSingleBlock from @goupdate3/opencode-mermaid
                │
                ▼
        beautiful-mermaid renders Mermaid → SVG string
                │
                ▼
        SVG → base64 data URL → ![diagram](data:image/svg+xml;...)
                │
                ▼
        + <details> block with collapsible source code
```

Custom tools are loaded by OpenCode from `~/.config/opencode/tools/` at startup.

---

## Security

- **Zero network requests** — all rendering is local
- **No external CDN** — SVG embedded as data URL, no third-party resources
- **No file system access** — tool doesn't read/write any files
- **HTML-escaped** — source code is properly escaped before rendering

---

## Development

```bash
bun install
bun test        # 24 tests
bun test --watch
```

---

## License

MIT

---

Built on [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid) for server-side SVG rendering and [OpenCode Custom Tools API](https://opencode.ai/docs/custom-tools).