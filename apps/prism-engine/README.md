# Prism Context Engine 🔮

> ⚠️ **BETA** — Prism Context Engine is currently in beta. Some features are still being refined.

The Context Operating System for developers who ship fast. Deploy a Context Server that forces Cursor, Windsurf, and Claude to follow your Design System.

## Features

- 📤 **Multi-IDE Export** — Cursor, Windsurf, VS Code, Claude
- 🔌 **MCP Integration** — Model Context Protocol for IDE sync
- 🏗️ **Project Baker** — Create projects with tech stack & vibe

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) to view the dashboard.

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database
MONGODB_URI=
COSMOS_DATABASE_NAME=prism

# AI Provider (deepseek | azure | gemini)
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT_NAME=
GEMINI_API_KEY=
```

## Architecture

```
src/
├── app/
│   ├── (dashboard)/     # Protected dashboard routes
│   ├── api/             # API routes (MCP, auth, etc.)
│   └── page.tsx         # Landing page
├── components/
│   ├── beta-badge.tsx   # Beta indicator
│   ├── hero.tsx         # Animated hero
│   └── layout/          # Navigation components
└── lib/
    ├── subscriptions.ts # Tier limits
    └── subscription-actions.ts
```

## Subscription Tiers

| Tier | Rules | Projects | IDE Sync |
| ---- | ----- | -------- | -------- |
| Free | 5     | 1        | ❌       |
| Pro  | ∞     | 10       | ✅       |
| Team | ∞     | ∞        | ✅       |

## License

Proprietary — © 2026 JeffDev Studio
