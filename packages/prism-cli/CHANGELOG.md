# Changelog - Prism Context Engine CLI

All notable changes to the Prism CLI will be documented in this file.

## [1.1.0] - 2026-05-19

### ✨ New Commands

**Projects** (`prism projects`)

- `list` — List your projects with stack/design system info
- `view <slug>` — View project details, rules, and videos
- `create` — Interactive project creation
- `delete <slug>` — Delete a project with confirmation

**Brands** (`prism brands`)

- `list` — List your brand profiles
- `view <slug>` — View full brand details (colors, typography, voice)
- `create` — 5-step interactive brand creation wizard
- `export <slug>` — Export brand as cursor/windsurf/vscode/claude/css/tailwind rules
- `delete <slug>` — Delete a brand

**AI Kitchen** (`prism generate`)

- Generate React/Next.js/React Native components via Gemini AI
- Options: `--prompt`, `--design`, `--stack`, `--rules`, `--output`

**Marketplace** (`prism marketplace`)

- `list` — Browse and search public rule sets
- `install <id>` — Install a marketplace rule set

**Analytics** (`prism analytics`)

- View usage stats with progress bars: projects, rules, components, AI generations
- Shows tier limits and reset date

**API Keys** (`prism api-keys`)

- `list` — List your API keys
- `create` — Generate a new API key (shown once, copy immediately)
- `revoke <id>` — Revoke an existing API key

### 🔧 Enhanced Commands

**Rules** (`prism rules`)

- `list` — List rules with category grouping
- `create` — Create a new rule (interactive or via options)
- `edit <id>` — Edit an existing rule
- `delete <id>` — Delete a rule

**Sync** (`prism sync`)

- Now syncs projects, brands, and components to local cache in addition to rules
- Cache files: `~/.prism/{rules,projects,brands,components}.json`

### 🔧 Technical

- Added `--json` flag to all commands for programmatic/VS Code consumption
- New shared `apiFetch` helper for REST API communication
- All commands support both interactive mode and option-based mode

---

## [1.0.3] - 2026-01-03

### ✨ Features

- Context Rule Templates for Next.js, React, and React Native
- Design System Rules: 8-bit nostalgia, glassmorphic, bare minimum, JD Studio
- Interactive CLI with Commander.js

---

## [0.1.0] - 2025-12-31

### Initial Release

- Basic CLI structure with connect, login, init, sync, serve, rules commands
- MCP protocol support via stdio proxy
- IDE auto-detection (Cursor, Windsurf, VS Code, Claude Desktop)

---

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
