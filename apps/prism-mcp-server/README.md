# prism-mcp-server

Prism Context Engine MCP Server — provides architectural rules and context governance to AI coding assistants via the Model Context Protocol.

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

## MCP Tools

| Tool                      | Description                                |
| ------------------------- | ------------------------------------------ |
| `get_architectural_rules` | Fetch coding rules with semantic ranking   |
| `validate_code_pattern`   | Check code against regex patterns          |
| `prism_check`             | Validate code against governance rules     |
| `prism_fix`               | Auto-fix violations                        |
| `prism_scan`              | Scan URL with Playwright for design tokens |
| `get_skill`               | Fetch a procedural skill guide             |
| `list_skills`             | List available skills                      |
| `repo_extract`            | Generate rules from scan report            |
| `repo_scan`               | Scan current project directory             |

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
