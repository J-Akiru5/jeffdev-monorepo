# Prism Context Engine 🔮

> ⚠️ **BETA** — Prism Context Engine is currently in beta. Some features are still being refined.

The Context Operating System for developers who ship fast. Deploy a Context Server that forces Cursor, Windsurf, and Claude to follow your Design System.

## Features

- 🎬 **Video to Context** — Record architecture decisions, AI extracts rules
- 🎨 **Brand Wizard** — 5-step brand identity builder
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
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Database
MONGODB_URI=
COSMOS_DATABASE_NAME=prism

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT_NAME=

# Mux (Video)
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
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
|------|-------|----------|----------|
| Free | 5 | 1 | ❌ |
| Pro | ∞ | 10 | ✅ |
| Team | ∞ | ∞ | ✅ |

## License

Proprietary — © 2026 JeffDev Studio
