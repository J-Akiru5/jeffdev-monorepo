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

| Tool              | Description                                                                                                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prism_kitchen`   | **Context budget optimizer.** Analyzes what the AI will receive and optimizes it. Returns token savings report. Use `action: "analyze"` for full report or `action: "preview"` for just the context.                        |
| `prism_intercept` | **Active interception agent.** Prevents the generate→violate→fix cycle. Call with `task` before generating code to get forbidden/required patterns. Call with `code` after generating to validate and get fix instructions. |

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

### Recommended Workflow

```
1. prism_kitchen (analyze)    → See what the AI will receive, check savings
2. get_architectural_rules    → Fetch optimized rules for the task
3. prism_intercept (task)     → Get pre-flight guard rails
4. [AI generates code]        → Uses rules + guard rails as constraints
5. prism_check                → Validate generated code
6. prism_fix                  → Auto-fix any remaining violations
```

This workflow eliminates the wasteful generate→violate→regenerate cycle.

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
