# opencode-mermaid

OpenCode plugin — renders Mermaid diagrams **inline in chat** as SVG images with collapsible source view. No external browser tab, no ASCII approximations.

```mermaid
graph TD
  A[Client] --> B[API Server]
  B --> C[(Database)]
```

↑ AI writes a ` ```mermaid ` block and it instantly becomes a **visible diagram in the chat flow**.

---

## Install

```jsonc
// .opencode/opencode.json
{
  "plugin": ["@goupdate3/opencode-mermaid"]
}
```

OpenCode installs it from GitHub automatically on next start. No npm, no config needed.

### For AI agents: enable the plugin in OpenCode

If you're an AI coding agent and need to tell the user how to install this:

```
To render Mermaid diagrams inline, add this to .opencode/opencode.json:

{
  "plugin": ["@goupdate3/opencode-mermaid"]
}

Then restart OpenCode. After that, wrap any Mermaid diagram
in a ```mermaid code block — it will render as SVG automatically.
```

---

## Usage

1. Start a conversation with the AI
2. Ask for a diagram — the system prompt tells the AI it can use ` ```mermaid ` blocks
3. The plugin auto-detects mermaid blocks and renders them as **inline SVG images**
4. Click **"📝 Mermaid source"** to reveal the original source code

No tool calls. No external browser. Just write ` ```mermaid ` and it renders.

---

## Examples

**Flowchart — CI/CD pipeline:**

```mermaid
graph LR
  A[Push to GitHub] --> B[Run Tests]
  B --> C{Tests Pass?}
  C -->|Yes| D[Build Docker Image]
  C -->|No| E[Notify Dev]
  D --> F[Deploy to Staging]
  F --> G[Run E2E Tests]
  G --> H{All Green?}
  H -->|Yes| I[Deploy to Prod]
  H -->|No| E
```

**Sequence — OAuth 2.0 login flow:**

```mermaid
sequenceDiagram
  participant U as User
  participant A as App
  participant P as Auth Provider
  participant D as Database

  U->>A: Click "Login"
  A->>P: Redirect to OAuth
  P->>U: Show consent screen
  U->>P: Approve
  P->>A: Return auth code
  A->>P: Exchange code for tokens
  P->>A: Access + Refresh token
  A->>D: Store user session
  A->>U: Logged in
```

**Class — data model:**

```mermaid
classDiagram
  class User {
    +uuid id
    +string email
    +string name
    +login()
    +logout()
  }
  class Order {
    +uuid id
    +decimal total
    +string status
    +cancel()
  }
  class Product {
    +uuid id
    +string name
    +decimal price
  }
  User "1" --> "*" Order : places
  Order "*" --> "*" Product : contains
```

**State — auth session lifecycle:**

```mermaid
stateDiagram-v2
  [*] --> Guest
  Guest --> LoggingIn : submit credentials
  LoggingIn --> Authenticated : success
  LoggingIn --> Error : failure
  Error --> LoggingIn : retry
  Authenticated --> Guest : logout
  Authenticated --> Expired : token timeout
  Expired --> LoggingIn : refresh
```

**ER — blog database schema:**

```mermaid
erDiagram
  User ||--o{ Post : writes
  Post ||--o{ Comment : has
  User ||--o{ Comment : writes
  Post }o--|| Category : belongs_to
```

---

## Supported diagram types

| Type | Syntax | Status |
|---|---|---|
| Flowchart | `graph TD`, `flowchart LR`, etc. | ✅ |
| Sequence | `sequenceDiagram` | ✅ |
| Class | `classDiagram` | ✅ |
| State | `stateDiagram-v2` | ✅ |
| ER | `erDiagram` | ✅ |
| Pie | `pie` | ❌ (v0.1) |
| Gantt | `gantt` | ❌ (v0.1) |
| Mindmap | `mindmap` | ❌ (v0.1) |
| Timeline | `timeline` | ❌ (v0.1) |
| Git Graph | `gitGraph` | ❌ (v0.1) |

Unsupported types fall back to showing the original ` ```mermaid ` block unchanged.

---

## How it works

```
AI writes ```mermaid block
        │
        ▼
experimental.text.complete hook intercepts output
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

---

## Security

- **Zero network requests** — all rendering is local
- **No external CDN** — SVG embedded as data URL, no third-party resources
- **No file system access** — plugin doesn't read/write any files
- **HTML-escaped** — source code is properly escaped before rendering
- **Minimal dependencies** — one runtime dependency

---

## Development

```bash
bun install
bun test        # 23 tests
bun test --watch
```

### Run a test instance

```bash
opencode web --port 4090
```

Opens a second OpenCode instance on port 4090 with no other plugins active — ideal for plugin development.

---

## License

MIT

---

Built on [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid) for server-side SVG rendering and [OpenCode Plugin API](https://opencode.ai) for chat integration. Thanks to these projects for laying the foundation.