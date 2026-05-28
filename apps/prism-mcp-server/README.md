# prism-mcp-server

Prism Context Engine MCP Server — provides architectural rules and context governance to AI coding assistants via the Model Context Protocol.

**Token Reduction:** Achieves 60-70% token savings through smart context selection, deduplication, and active interception.

## Quick Start

```bash
# From monorepo root
pnpm --filter prism-mcp-server run build
pnpm --filter prism-mcp-server run dev
```

## Environment Variables

| Variable                 | Required        | Default                        | Description                       |
| ------------------------ | --------------- | ------------------------------ | --------------------------------- |
| `MONGODB_URI`            | Yes             | —                              | Azure Cosmos DB connection string |
| `COSMOS_DATABASE_NAME`   | No              | `prism`                        | Database name                     |
| `PRISM_API_KEY`          | No              | —                              | API key for subscription auth     |
| `PRISM_API_URL`          | No              | `https://prism.jeffdev.studio` | Prism API endpoint                |
| `GOOGLE_GEMINI_API_KEY`  | For AI features | —                              | Gemini API key                    |
| `GEMINI_MODEL`           | No              | `gemini-3.5-flash`             | Chat model                        |
| `GEMINI_EMBEDDING_MODEL` | No              | `gemini-embedding-2`           | Embedding model                   |
| `AI_PROVIDER`            | No              | `gemini`                       | Set to `azure` for Azure OpenAI   |
| `USE_GREMLIN_RANKING`    | No              | `false`                        | Enable graph-based rule ranking   |

## MCP Tools

### Core Tools

| Tool                      | Description                                                           |
| ------------------------- | --------------------------------------------------------------------- |
| `get_architectural_rules` | Fetch coding rules with semantic ranking and token budget enforcement |
| `prism_check`             | Validate code against governance rules (pattern-based)                |
| `prism_fix`               | Auto-fix violations (cross-app imports, inline styles, console.log)   |
| `get_skill`               | Fetch a procedural skill guide by ID                                  |
| `list_skills`             | List available skills for a project                                   |

### Context Optimization Tools

| Tool                | Description                                                                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prism_orchestrate` | **One-call governance engine.** Chains all tools in a single call. Reduces tool calls from 5→1 and tokens by 60-70%. Three modes: full, compact, minimal. |
| `prism_kitchen`     | **Context budget optimizer.** Analyzes what the AI will receive and optimizes it. Returns token savings report.                                           |
| `prism_intercept`   | **Active interception agent.** Prevents the generate→violate→fix cycle. Pre-generation guard rails + post-generation validation.                          |
| `prism_compile`     | **Rule Compiler.** Transforms rules into executable validators (TypeScript type guards, import validators, fix templates).                                |
| `prism_memory`      | **Governance memory.** Persistent AI agent memory across sessions and team members. Stores decisions, patterns, violations, and team consensus.           |

### Scanning Tools

| Tool           | Description                                    |
| -------------- | ---------------------------------------------- |
| `prism_scan`   | Scan URL with Playwright for design tokens     |
| `repo_scan`    | Scan current project directory for conventions |
| `repo_extract` | Generate rules from scan report via AI         |

### Utility Tools

| Tool                    | Description                         |
| ----------------------- | ----------------------------------- |
| `validate_code_pattern` | Check code against regex patterns   |
| `prism_health`          | Server health check and diagnostics |

## Token Reduction Strategy

The 64% token reduction target is achieved through:

1. **Smart Selection** — Embedding-based rule ranking filters out irrelevant rules (task-scoped)
2. **Deduplication** — Merges near-identical rules (>80% Jaccard similarity)
3. **Priority Truncation** — High priority = full content, medium = summary, low = skip
4. **Active Interception** — `prism_intercept` prevents the generate→violate→fix cycle
5. **Context Kitchen** — `prism_kitchen` analyzes and optimizes before sending
6. **Rule Compilation** — `prism_compile` transforms rules into executable constraints

### Recommended Workflow

```
1. prism_memory (read)        → Load lessons from past sessions
2. prism_orchestrate          → One call: compile + optimize + guard rails + memory
3. [AI generates code]        → Uses compiled constraints + memory as context
4. prism_memory (write)       → Store decisions and patterns for future sessions
```

The **Rule Compiler** (`prism_compile`) is the key differentiator. Instead of giving the AI markdown rules to read (and potentially ignore), it compiles rules into:

- **TypeScript type guards** — violating code fails to compile
- **Import validators** — banned imports are caught at the module level
- **Fix templates** — deterministic auto-fixes (not AI-generated)
- **Injection context** — system-level constraints the AI cannot ignore

## IDE Configuration

Add to your IDE's MCP settings:

```json
{
  "mcpServers": {
    "prism": {
      "command": "node",
      "args": ["path/to/prism-mcp-server/dist/index.js"],
      "env": {
        "MONGODB_URI": "your-connection-string",
        "GOOGLE_GEMINI_API_KEY": "your-key"
      }
    }
  }
}
```

Or use the CLI for automatic setup:

```bash
npx prism-context-engine init
```

## Graceful Shutdown

The server handles both `SIGINT` (Ctrl+C) and `SIGTERM` (Docker/CI) signals, closing database connections cleanly.

## License

MIT
