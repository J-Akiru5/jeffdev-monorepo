# prism-mcp-server

**Universal Context Governance for AI Coding Assistants.**

One service. All protocols. Always-on governance. No matter what agent, IDE, or tool.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Universal Context Gateway                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   MCP    │  │   REST   │  │  Git     │  │   File   │        │
│  │ (stdio)  │  │  (HTTP)  │  │  Hooks   │  │ (export) │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       └──────────────┴──────────────┴──────────────┘             │
│                              │                                   │
│                    ┌─────────▼─────────┐                         │
│                    │  Governance Core   │                         │
│                    │  ├── Rules Engine  │                         │
│                    │  ├── Memory Layer  │                         │
│                    │  ├── Validators    │                         │
│                    │  └── Analytics     │                         │
│                    └───────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

## Protocols

| Protocol        | Transport  | Use Case                                       |
| --------------- | ---------- | ---------------------------------------------- |
| **MCP**         | stdio      | Cursor, Claude Desktop, Windsurf, Continue     |
| **REST**        | HTTP       | CI/CD, GitHub Actions, custom agents, webhooks |
| **Git Hooks**   | shell      | Pre-commit enforcement (any repository)        |
| **File Export** | filesystem | Copilot, Codeium, any tool that reads files    |

## Quick Start

```bash
# MCP server (for IDEs)
pnpm --filter prism-mcp-server run build
pnpm --filter prism-mcp-server run start

# REST gateway (for CI/CD, custom agents)
pnpm --filter prism-mcp-server run start:gateway

# Git hook (for pre-commit enforcement)
npx prism-git-hook
```

## Environment Variables

| Variable                 | Required        | Default                       | Description                       |
| ------------------------ | --------------- | ----------------------------- | --------------------------------- |
| `MONGODB_URI`            | Yes             | —                             | Azure Cosmos DB connection string |
| `COSMOS_DATABASE_NAME`   | No              | `prism`                       | Database name                     |
| `PRISM_API_KEY`          | No              | —                             | API key for subscription auth     |
| `PRISM_API_URL`          | No              | `https://prism.syntaxure.dev` | Prism API endpoint                |
| `GOOGLE_GEMINI_API_KEY`  | For AI features | —                             | Gemini API key                    |
| `GEMINI_MODEL`           | No              | `gemini-3.5-flash`            | Chat model                        |
| `GEMINI_EMBEDDING_MODEL` | No              | `gemini-embedding-2`          | Embedding model                   |
| `AI_PROVIDER`            | No              | `gemini`                      | Set to `azure` for Azure OpenAI   |
| `USE_GREMLIN_RANKING`    | No              | `false`                       | Enable graph-based rule ranking   |
| `PRISM_GATEWAY_PORT`     | No              | `3003`                        | REST gateway port                 |

## MCP Tools (16)

### One-Call Governance

| Tool                | Description                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| `prism_orchestrate` | **Start here.** One call: compile + optimize + guard rails + memory. 5→1 tool calls, 64%+ savings. |

### Context Optimization

| Tool              | Description                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `prism_drip`      | **Context Drip.** Progressive rule disclosure. Drip-feeds only what's needed. 80-90% savings. |
| `prism_kitchen`   | Context budget optimizer with savings report                                                  |
| `prism_intercept` | Active interception (prevents generate→violate→fix)                                           |
| `prism_compile`   | Rule Compiler (rules → executable validators)                                                 |
| `prism_memory`    | Persistent governance memory across sessions/teams                                            |

### Core Tools

| Tool                      | Description                            |
| ------------------------- | -------------------------------------- |
| `get_architectural_rules` | Smart-ranked rules with token budget   |
| `prism_check`             | Validate code against governance rules |
| `prism_fix`               | Auto-fix violations                    |
| `get_skill`               | Fetch procedural skill guide           |
| `list_skills`             | List available skills                  |

### Scanning

| Tool                    | Description                  |
| ----------------------- | ---------------------------- |
| `prism_scan`            | URL scanning with Playwright |
| `repo_scan`             | Project directory scanning   |
| `repo_extract`          | AI rule generation from scan |
| `validate_code_pattern` | Pattern matching             |

### Utility

| Tool           | Description        |
| -------------- | ------------------ |
| `prism_health` | Server diagnostics |

## REST API

```bash
# Get governance context for a task
curl -X POST http://localhost:3003/api/govern \
  -H "Content-Type: application/json" \
  -d '{"task": "build a login form", "format": "markdown"}'

# Validate code against rules
curl -X POST http://localhost:3003/api/validate \
  -H "Content-Type: application/json" \
  -d '{"code": "import x from \"../../apps/foo\""}'

# Export rules for a specific tool
curl -X POST http://localhost:3003/api/export \
  -H "Content-Type: application/json" \
  -d '{"format": "copilot"}'

# Health check
curl http://localhost:3003/api/health
```

## Git Hook

```bash
# Install in any repository
npx prism-git-hook

# Or add to .git/hooks/pre-commit manually
#!/bin/sh
npx prism-git-hook
```

Built-in checks (no DB needed):

- Cross-app imports
- Console.log in production code
- Inline styles in React
- TODO/FIXME without ticket reference
- Hardcoded secrets

## File Export Formats

| Format     | Output File                       | Tool           |
| ---------- | --------------------------------- | -------------- |
| `copilot`  | `.github/copilot-instructions.md` | GitHub Copilot |
| `cursor`   | `.cursorrules`                    | Cursor         |
| `windsurf` | `.windsurfrules`                  | Windsurf       |
| `claude`   | `CLAUDE.md`                       | Claude Desktop |
| `markdown` | `governance-rules.md`             | Any tool       |

## Governance Memory

Persistent memory that survives across sessions and team members:

| Type        | Purpose                                                    |
| ----------- | ---------------------------------------------------------- |
| `decision`  | "We chose Tailwind over CSS modules"                       |
| `pattern`   | "All API routes follow: authenticate → validate → execute" |
| `violation` | "AI used inline styles 3 times last week"                  |
| `consensus` | "Team voted to use Zod v3 over v4"                         |
| `incident`  | "Rule #5 added after production incident"                  |
| `progress`  | "Working on auth module. 3 of 5 tasks complete."           |

## Token Reduction

```
╔══════════════════════════════════════════════════════╗
║  💰 CONTEXT SAVINGS: 64%+ reduction                  ║
║  📊 Smart selection + deduplication + compilation     ║
║  🔒 15 MCP tools + REST API + Git hooks + file export║
╚══════════════════════════════════════════════════════╝
```

## License

MIT
