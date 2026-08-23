# prism-context-engine

Prism CLI — Context Governance for LLMs. Manages rules, skills, and MCP server configuration for AI coding assistants.

## Installation

```bash
npm install -g prism-context-engine
```

## Quick Start — the Pass (local, zero network, zero account)

```bash
# One command: detect your stack, generate .prism/rules.json from your
# own design tokens, and wire the Claude Code enforcement hook.
prism init

# Team on the dashboard? Sync their rules instead — fails safe, never
# breaks a working setup if the network/auth/response goes wrong.
prism pull
```

`prism init` never touches the network — it reads your own `package.json`, `globals.css`, and Tailwind config. `prism pull` is the upgrade path once you have a Prism Cloud account: same output file, same v1 schema, just sourced from the team's dashboard rules instead of this repo's own CSS/Tailwind config. Neither requires interaction: pass `--yes` for CI.

Generated severity policy: the auto-detected token rule ships at `block` (its matches are exact hex literals lifted from your own source, so hits are real), scoped to code files (`.tsx/.jsx/.ts/.js/.html`) so your tokens' own definition lines in CSS never self-flag. The arbitrary-Tailwind-brackets rule ships at `warn` (heuristic — it will flag scaffold code) and never stops an agent's write; promote it to `"block"` in `.prism/rules.json` by hand once you trust it.

## Quick Start — full IDE/MCP setup (Cursor, Windsurf, VS Code, Claude Desktop)

```bash
# 1. Authenticate
prism login

# 2. Extract rules from your project
prism connect --url http://localhost:3000   # Scan live site
prism sync --repo ./                        # Scan repository

# 3. Configure your IDE's MCP connection
prism ide-setup

# 4. Verify
prism doctor
```

## Commands

| Command                                  | Description                                                                                                                                         |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prism init`                             | **The Pass, local path.** Generate `.prism/rules.json` from this project's own design tokens and wire the Claude Code hook. No network, no account. |
| `prism pull`                             | **The Pass, synced path.** Fetch `.prism/rules.json` from Prism Cloud for your team. Fails safe — never breaks an existing setup.                   |
| `prism login`                            | Authenticate with Prism Cloud                                                                                                                       |
| `prism ide-setup`                        | Auto-detect IDEs and write MCP config (was `prism init` before the Pass claimed that name)                                                          |
| `prism serve`                            | Start MCP server for IDE integration                                                                                                                |
| `prism sync`                             | Download rules from cloud (add `--repo` to scan local repo)                                                                                         |
| `prism connect --url <url>`              | Scan live website for design tokens                                                                                                                 |
| `prism rules list\|create\|edit\|delete` | Manage rules                                                                                                                                        |
| `prism projects list\|view\|create`      | Manage projects                                                                                                                                     |
| `prism brands list\|view\|create`        | Manage brand profiles                                                                                                                               |
| `prism marketplace list\|install`        | Browse/install rule sets                                                                                                                            |
| `prism kitchen analyze\|preview\|trim`   | Context budget management                                                                                                                           |
| `prism telemetry`                        | View token usage stats                                                                                                                              |
| `prism doctor`                           | Full health check                                                                                                                                   |
| `prism status`                           | Quick state snapshot                                                                                                                                |
| `prism check <files...>`                 | The Pass — lint mode. `--hook` reads a PostToolUse event from stdin for agent enforcement.                                                          |

## Environment Variables

| Variable                | Description                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `PRISM_API_KEY`         | API key from the dashboard (Settings → API Keys). Used by `prism pull` and for MCP authentication.   |
| `PRISM_API_URL`         | Override the Prism Cloud base URL (defaults to `https://prism.syntaxure.dev`). Used by `prism pull`. |
| `PRISM_PROJECT_ID`      | Default project ID                                                                                   |
| `MONGODB_URI`           | Cosmos DB connection (for full MCP server)                                                           |
| `GOOGLE_GEMINI_API_KEY` | Gemini API key (for AI features)                                                                     |
| `PRISM_DISABLE`         | Set to `1` to disable the `prism check --hook` kill switch                                           |

## How It Works

`prism serve` attempts to spawn the full `prism-mcp-server` as a child process. If unavailable, it falls back to a built-in lite server that reads rules from `~/.prism/rules/rules.json`.

## Local Files

Global state (shared across all projects) lives in `~/.prism/`:

```
~/.prism/
  token              # Auth token
  rules.json         # Rule cache
  rules/rules.json   # Lite server fallback
  telemetry.json     # Token usage events
  cache/             # LRU disk cache
```

Per-project state (the Pass) lives in the project itself, under `.prism/`:

```
.prism/
  rules.json         # v1 rule set — generated by `prism init`, fetched by `prism pull`,
                      # enforced by `prism check` / the Claude Code hook
  config.json         # optional — apiKey/apiUrl and which dashboard project(s) `prism pull`
                      # has synced with (activeProject + a projects map keyed by slug)
```

## License

MIT
