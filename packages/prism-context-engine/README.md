# prism-context-engine

Prism CLI — Context Governance for LLMs. Manages rules, skills, and MCP server configuration for AI coding assistants.

## Installation

```bash
npm install -g prism-context-engine
```

## Quick Start

```bash
# 1. Authenticate
prism login

# 2. Extract rules from your project
prism connect --url http://localhost:3000   # Scan live site
prism sync --repo ./                        # Scan repository

# 3. Configure your IDE
prism init

# 4. Verify
prism doctor
```

## Commands

| Command                                  | Description                                                 |
| ---------------------------------------- | ----------------------------------------------------------- |
| `prism login`                            | Authenticate with Prism Cloud                               |
| `prism init`                             | Auto-detect IDEs and write MCP config                       |
| `prism serve`                            | Start MCP server for IDE integration                        |
| `prism sync`                             | Download rules from cloud (add `--repo` to scan local repo) |
| `prism connect --url <url>`              | Scan live website for design tokens                         |
| `prism rules list\|create\|edit\|delete` | Manage rules                                                |
| `prism projects list\|view\|create`      | Manage projects                                             |
| `prism brands list\|view\|create`        | Manage brand profiles                                       |
| `prism marketplace list\|install`        | Browse/install rule sets                                    |
| `prism kitchen analyze\|preview\|trim`   | Context budget management                                   |
| `prism telemetry`                        | View token usage stats                                      |
| `prism doctor`                           | Full health check                                           |
| `prism status`                           | Quick state snapshot                                        |

## Environment Variables

| Variable                | Description                                |
| ----------------------- | ------------------------------------------ |
| `PRISM_API_KEY`         | API key for MCP authentication             |
| `PRISM_PROJECT_ID`      | Default project ID                         |
| `MONGODB_URI`           | Cosmos DB connection (for full MCP server) |
| `GOOGLE_GEMINI_API_KEY` | Gemini API key (for AI features)           |

## How It Works

`prism serve` attempts to spawn the full `prism-mcp-server` as a child process. If unavailable, it falls back to a built-in lite server that reads rules from `~/.prism/rules/rules.json`.

## Local Files

State is stored in `~/.prism/`:

```
~/.prism/
  token              # Auth token
  rules.json         # Rule cache
  rules/rules.json   # Lite server fallback
  telemetry.json     # Token usage events
  cache/             # LRU disk cache
```

## License

MIT
