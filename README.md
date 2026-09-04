# opencode-mermaid

OpenCode plugin — renders Mermaid diagrams **inline in chat** as SVG images via the `mermaid_diagram` custom tool. No external browser tab, no ASCII approximations.

---

## Install

**Step 1 — install** into OpenCode's config directory:

```bash
# macOS / Linux
cd ~/.config/opencode && npm install @goupdate3/opencode-mermaid

# Windows
cd %USERPROFILE%\.config\opencode && npm install @goupdate3/opencode-mermaid
```

**Step 2 — create the tool file** `~/.config/opencode/tools/mermaid_diagram.ts`:

```ts
export { default } from "@goupdate3/opencode-mermaid/tool";
```

**Step 3 — add instruction** to `opencode.jsonc`:

```jsonc
{ "instructions": [
  "To display a diagram: call mermaid_diagram tool, it returns a base64 SVG data URL. Embed the URL as markdown image: ![diagram](<URL>). Supported: flowchart, sequenceDiagram, classDiagram, stateDiagram-v2, erDiagram."
] }
```

**Step 4 — restart OpenCode.**

---

## Supported diagram types

| Type | Syntax | ✅/❌ |
|---|---|---|
| Flowchart | `graph TD`, `flowchart LR` | ✅ |
| Sequence | `sequenceDiagram` | ✅ |
| Class | `classDiagram` | ✅ |
| State | `stateDiagram-v2` | ✅ |
| ER | `erDiagram` | ✅ |
| Pie/Gantt/other | — | ❌ |

---

## How it works

```
AI calls mermaid_diagram(code) 
     → beautiful-mermaid renders SVG 
     → base64 data URL returned 
     → AI embeds as ![diagram](data:image/svg+xml;base64,...)
     → visible in Web UI chat
```

---

## Security

- Zero network requests — local rendering only
- No external CDN
- SVG as base64 data URL

---

## Dev

```bash
bun install && bun test && npx tsup
```

MIT. Built on [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid).