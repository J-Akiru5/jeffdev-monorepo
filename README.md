<div align="center">

# ◈ JeffDev Monorepo

**Enterprise-Grade Web Development Infrastructure**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.7-EF4444?logo=turborepo)](https://turbo.build/)

_Building the future of AI-assisted development_

[Agency](https://jeffdev.studio) · [Prism Docs](https://prism.jeffdev.studio) · [Changelog](./CHANGELOG.md)

</div>

---

## Overview

This monorepo powers **JeffDev Studio** — a premium web development agency — and **Prism Context Engine** — a context governance system for AI coding assistants.

**Current Version**: `0.1.3` (January 3, 2026)

### What's New in v0.1.3

- 🎨 **Brand Management System**: Enterprise branding capture with multi-IDE export (Cursor, Windsurf, VS Code, Claude, CSS, Tailwind)
- 📹 **Video Context Pipeline**: Mux integration for video-based rule extraction
- 🤖 **AI Component Generator**: Gemini-powered component creation with design system awareness

```
┌─────────────────────────────────────────────────────────────────┐
│                     JeffDev Monorepo                            │
├─────────────────────────────────────────────────────────────────┤
│  apps/                                                          │
│  ├── agency          → Marketing site + Admin CRM               │
│  ├── prism-dashboard → SaaS platform for developers             │
│  ├── prism-docs      → Documentation (Nextra)                   │
│  └── prism-mcp-server→ AI context server (MCP)                  │
├─────────────────────────────────────────────────────────────────┤
│  packages/                                                      │
│  ├── ui              → @jdstudio/ui component library           │
│  ├── db              → Firebase + Cosmos DB clients             │
│  └── config          → Shared TypeScript/ESLint configs         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer           | Technology                                 |
| --------------- | ------------------------------------------ |
| **Framework**   | Next.js 16 (App Router)                    |
| **UI**          | React 19, Tailwind CSS, Headless UI        |
| **Database**    | Firebase (Agency), Azure Cosmos DB (Prism) |
| **Auth**        | Clerk                                      |
| **AI Protocol** | Model Context Protocol (MCP)               |
| **Secrets**     | Doppler                                    |
| **Monorepo**    | Turborepo                                  |

---

## Applications

### 🏢 Agency (`apps/agency`)

The JeffDev Studio marketing site and client management system.

- **Port**: 3000
- **Stack**: Next.js 16, Firebase, Tailwind

### 🔮 Prism Dashboard (`apps/prism-dashboard`)

SaaS platform for developers to manage AI context rules.

- **Port**: 3001
- **Stack**: Next.js 16, Clerk Auth, Cosmos DB
- **Features**: Brand management, video context pipeline, AI component generator

### 📚 Prism Docs (`apps/prism-docs`)

Documentation for the Prism Context Engine.

- **Port**: 3002
- **Stack**: Nextra 4

### 🧠 Prism MCP Server (`apps/prism-mcp-server`)

AI context server implementing the Model Context Protocol.

- **Transport**: stdio
- **Tools**: `get_architectural_rules`, `validate_code_pattern`
- **Version**: 0.1.3

---

## Packages

### @jdstudio/ui

Ghost Glow component library following the JeffDev Design System.

```tsx
import { Button, Card, Badge } from "@jdstudio/ui";

<Card variant="interactive">
  <Button variant="cyan">Deploy</Button>
  <Badge variant="success">Active</Badge>
</Card>;
```

**Components**: Button, Card, Input, Badge, ProgressBar, DataTable

### @syntaxure-labs/db

Unified database clients for Firebase and Azure Cosmos DB with Zod schemas.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- [Doppler CLI](https://docs.doppler.com/docs/install-cli) (for secrets)

### Installation

```bash
# Clone repository
git clone https://github.com/jeffdev/jeffdev-monorepo.git
cd jeffdev-monorepo

# Install dependencies
npm install

# Link Doppler secrets
doppler setup

# Start all apps
doppler run -- turbo dev
```

### Development Ports

| App             | URL                   |
| --------------- | --------------------- |
| Agency          | http://localhost:3000 |
| Prism Dashboard | http://localhost:3001 |
| Prism Docs      | http://localhost:3002 |

---

## Architecture

```mermaid
graph TB
    subgraph Clients
        CURSOR[Cursor/Windsurf]
        WEB[Web Browser]
    end

    subgraph Apps
        AGENCY[Agency :3000]
        DASH[Dashboard :3001]
        DOCS[Docs :3002]
        MCP[MCP Server]
    end

    subgraph Data
        FIREBASE[(Firebase)]
        COSMOS[(Cosmos DB)]
    end

    WEB --> AGENCY
    WEB --> DASH
    WEB --> DOCS
    CURSOR --> MCP
    AGENCY --> FIREBASE
    DASH --> COSMOS
    MCP --> COSMOS
```

---

## Scripts

```bash
# Development
doppler run -- turbo dev              # Start all apps
doppler run -- turbo dev --filter=agency  # Start agency only

# Build
turbo build                           # Build all apps
turbo build --filter=prism-dashboard  # Build specific app

# Type Checking
turbo check-types                     # Check all packages

# Database
doppler run -- npm run db:seed -w packages/db  # Seed Cosmos DB
```

---

## License

**Proprietary © 2026 JeffDev Studio. All Rights Reserved.**

This software is proprietary and confidential. Unauthorized copying, distribution, or use of this software is strictly prohibited. For licensing inquiries, contact [hello@jeffdev.studio](mailto:hello@jeffdev.studio).

---

<div align="center">

Built with ❤️ by [JeffDev Studio](https://jeffdev.studio)

</div>
