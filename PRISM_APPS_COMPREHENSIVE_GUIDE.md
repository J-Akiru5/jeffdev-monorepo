# Prism Apps Ecosystem - Comprehensive Guide

> A complete analysis of the Prism Context Engine suite and its related applications within the JeffDev monorepo.

---

## 🎯 System Overview

The Prism suite comprises 5 interconnected applications that work together to provide architectural governance, AI context management, and developer experience tools. The system is built on Next.js 16, Azure Cosmos DB, and the Model Context Protocol (MCP).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PRISM CONTEXT ENGINE ECOSYSTEM                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ FRONTEND LAYER                                                       │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                      │  │
│  │  prism-dashboard (Port 3001)  → SaaS Platform for developers       │  │
│  │    • Brand Wizard                                                  │  │
│  │    • Video-to-Context pipeline                                     │  │
│  │    • AI Component Generator                                        │  │
│  │    • Rule Management                                              │  │
│  │    • Subscription Tiers (Free/Pro/Team/Enterprise)               │  │
│  │                                                                      │  │
│  │  prism-docs (Port 3002)        → Documentation Site              │  │
│  │    • User guides & tutorials                                      │  │
│  │    • API documentation                                             │  │
│  │    • Multi-language support (en-US, ja, tl)                      │  │
│  │                                                                      │  │
│  │  prism-admin (Port 3004)       → Admin Dashboard                 │  │
│  │    • System administration                                        │  │
│  │    • Firebase-based configuration                                 │  │
│  │    • Webhook management                                           │  │
│  │                                                                      │  │
│  │  prism-exercise (Port 3003)    → Practice Platform              │  │
│  │    • Coding exercises (Supabase-based)                           │  │
│  │    • Interactive learning                                         │  │
│  │    • Speech recognition features                                  │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                          ↓                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ BACKEND & GOVERNANCE LAYER                                           │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                      │  │
│  │  prism-mcp-server (Stdio Transport)                                │  │
│  │    • Model Context Protocol implementation                         │  │
│  │    • Rule serving & semantic search                               │  │
│  │    • Video transcript processing                                  │  │
│  │    • IDE integration (Cursor, Windsurf, VS Code, Claude)         │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                          ↓                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ DATA & SERVICES LAYER                                              │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                      │  │
│  │  @jeffdev/db (Shared Database Package)                            │  │
│  │    ├─ Cosmos.ts  → MongoDB/Azure Cosmos DB client                │  │
│  │    ├─ Schema.ts  → Zod schemas (Rules, Users, Projects, etc.)   │  │
│  │    └─ Firebase.ts→ Firebase Admin SDK integration                │  │
│  │                                                                      │  │
│  │  @jdstudio/ui (Component Library)                                 │  │
│  │    • Shared UI components (Button, Card, Badge, etc.)           │  │
│  │    • Ghost Glow design system                                    │  │
│  │    • Tailwind CSS v4 + Headless UI                             │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Application Details

### 1. **prism-dashboard** (Port 3001)
**Main Purpose**: SaaS platform for managing architectural rules and context for AI development assistants.

#### Directory Structure
```
apps/prism-dashboard/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Auth routes (sign-in, sign-up)
│   │   ├── (dashboard)/         # Protected dashboard routes
│   │   │   ├── brand/           # Brand wizard interface
│   │   │   ├── dashboard/       # Main dashboard
│   │   │   ├── projects/        # Project management
│   │   │   ├── settings/        # User settings
│   │   │   ├── subscription/    # Subscription management
│   │   │   ├── generate/        # AI component generator
│   │   │   └── showcase/        # Component showcase
│   │   ├── api/
│   │   │   ├── admin/           # Admin endpoints
│   │   │   ├── api-keys/        # API key management
│   │   │   ├── auth/            # Auth endpoints
│   │   │   ├── brand/           # Brand API
│   │   │   ├── generate/        # Generation endpoints
│   │   │   ├── mcp/             # MCP server endpoints
│   │   │   │   ├── search/      # MCP search
│   │   │   │   └── stdio/       # Stdio transport
│   │   │   ├── subscriptions/   # Subscription API
│   │   │   ├── upload/          # File upload
│   │   │   ├── usage/           # Usage tracking
│   │   │   └── webhooks/        # Webhook handlers
│   │   ├── pricing/             # Pricing page
│   │   ├── privacy/             # Privacy policy
│   │   ├── terms/               # Terms of service
│   │   └── page.tsx             # Landing page
│   ├── components/
│   │   ├── ai-kitchen/          # AI component generator
│   │   ├── animation/           # GSAP animations
│   │   ├── beta-badge.tsx       # Beta indicator
│   │   ├── hero/                # Hero section
│   │   ├── layout/              # Navigation & layout
│   │   ├── prism/               # Prism-specific components
│   │   ├── subscription/        # Subscription components
│   │   ├── ui/                  # UI components
│   │   └── video-context-uploader.tsx
│   └── lib/
│       ├── azure-openai.ts      # Azure OpenAI integration
│       ├── gemini.ts            # Google Gemini integration
│       ├── mux-transcript.ts    # Mux transcript handling
│       ├── subscription-actions.ts
│       └── subscriptions.ts     # Tier limits & pricing
├── middleware.ts                 # Auth middleware
└── package.json

```

#### Key Technologies
| Technology | Purpose |
|---|---|
| **Next.js 16** | Framework with App Router |
| **React 19** | UI library |
| **Clerk** | Authentication (6.20.0) |
| **MongoDB/Cosmos DB** | Rule storage via @jeffdev/db |
| **Azure OpenAI** | Rule extraction from videos |
| **Google Gemini** | Component generation |
| **Mux** | Video hosting & transcription |
| **Tailwind CSS v4** | Styling (Ghost Glow theme) |

#### Main Data Models

**Subscription Tiers** (from `lib/subscriptions.ts`):
```typescript
type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise';

TIER_LIMITS:
├── free:       5 rules, 1 project, NO IDE sync
├── pro:        ∞ rules, 10 projects, ✅ IDE sync
├── team:       ∞ rules, ∞ projects, 10 team members
└── enterprise: Full unlimited access
```

**Prices** (USD/PHP):
- **Pro**: $18/mo or PHP 990/mo
- **Team**: $54/mo or PHP 2990/mo

#### Key Features
1. **Brand Wizard** - 5-step brand identity builder
   - Capture colors, typography, voice, imagery
   - Export to multiple IDEs (.cursorrules, .windsurfrules, etc.)

2. **Video-to-Context Pipeline**
   - Upload videos via Mux
   - Extract architectural rules using Azure OpenAI
   - Semantic search across transcripts

3. **AI Component Generator** (AI Kitchen)
   - Google Gemini-powered component generation
   - Design system-aware
   - Generates code directly from descriptions

4. **Authentication & Authorization**
   - Clerk-based auth with role hierarchy
   - Public metadata for role management

#### Integration Points
- **→ prism-mcp-server**: Provides rules & context
- **← Mux webhooks**: Video processing events
- **← Azure OpenAI**: Rule extraction
- **← Google Gemini**: Component generation
- **↔ @jeffdev/db**: Rule & subscription storage

---

### 2. **prism-mcp-server** (Stdio Transport)
**Main Purpose**: Model Context Protocol server that serves architectural rules and governs AI behavior in code editors.

#### Directory Structure
```
apps/prism-mcp-server/
├── src/
│   ├── index.ts                 # Main MCP server implementation
│   └── lib/
│       ├── azure-openai.ts      # Embedding generation
│       └── vector-search.ts     # Semantic search
├── tests/                       # Vitest test files
├── tsconfig.json
└── vitest.config.ts
```

#### Key Technologies
| Technology | Purpose |
|---|---|
| **@modelcontextprotocol/sdk** | MCP protocol implementation |
| **MongoDB** | Azure Cosmos DB client (6.15.0) |
| **Azure OpenAI** | Embedding generation for search |
| **OpenAI** | Could be backup for embeddings |
| **Zod** | Input validation |
| **Vitest** | Testing framework |

#### MCP Protocol Features

**Server Identity**:
```typescript
Name: "jeffdev-prism-engine"
Version: "1.0.3"
Transport: Stdio (stdin/stdout)
```

**Resources** (read-only):
- `prism://rules/{id}` - Individual rules as markdown

**Tools** (callable):
1. **get_architectural_rules**
   - Fetch coding standards by category (architecture, styling, security, performance)
   - Optional tag filtering
   
2. **validate_code_pattern**
   - Check code against architectural rules
   - Uses regex pattern matching
   
3. **search_video_transcript**
   - Semantic search via Azure OpenAI embeddings
   - Find architectural discussions from video transcripts
   - Optional project filtering

#### Database Connection
```typescript
// Singleton pattern
MONGODB_URI → Azure Cosmos DB (MongoDB API)
Database: "prism" (configurable via COSMOS_DATABASE_NAME)
Collection: "rules"

// Connection settings:
- retryWrites: false (Cosmos DB limitation)
- maxPoolSize: 5
- maxIdleTimeMS: 30000
```

#### Rule Data Model
```typescript
Rule {
  _id: ObjectId
  name: string               // Rule name
  description: string        // What rule enforces
  category: string           // architecture|styling|security|performance
  content: string            // Rule instructions
  isPublic: boolean          // Public/private visibility
  priority: number           // 1=highest
  tags: string[]             // Optional filtering
  createdBy: string          // User ID
  createdAt: Date
  updatedAt?: Date
}
```

#### Authentication
- **API Key validation** against prism-dashboard
- **Subscription tiers** enforced (Free tier limited)
- **User context** cached on startup
- **Upgrade URLs** provided if tier exceeded

#### Integration Points
- **← prism-dashboard**: Rule creation & API key validation
- **← Editors**: Cursor, Windsurf, VS Code, Claude Desktop
- **↔ Azure Cosmos DB**: Rule persistence
- **↔ Azure OpenAI**: Embedding generation for semantic search

#### Version History
- **1.0.3** (2026-01-03): Semantic search, video transcripts, MCP compliance
- **0.1.3** (2025-12-31): Initial MCP structure

---

### 3. **prism-docs** (Port 3002)
**Main Purpose**: Documentation site using Nextra with multi-language support.

#### Directory Structure
```
apps/prism-docs/
├── app/                        # Next.js App Router
├── api/
│   └── docs-assistant/        # AI-powered documentation
├── components/                # Reusable components
├── content/                   # MDX content
│   ├── en-US/                # English documentation
│   ├── ja/                   # Japanese
│   ├── tl/                   # Tagalog
│   └── ...other languages
├── hooks/                     # Custom hooks
├── public/                    # Static assets
├── theme.config.tsx          # Nextra configuration
├── middleware.ts             # i18n middleware
├── postcss.config.mjs        # PostCSS config
├── tailwind.config.js        # Tailwind config
└── next.config.mjs           # Next.js config
```

#### Key Technologies
| Technology | Purpose |
|---|---|
| **Nextra 4** | Documentation framework |
| **Next.js 16** | Framework |
| **React 19** | UI |
| **Tailwind CSS v4** | Styling |
| **MDX** | Markdown + React |

#### Features
- **Multi-language support**: en-US, ja, tl (and more in locales/)
- **AI-powered docs assistant** at `/api/docs-assistant`
- **Responsive design** with Nextra's default theme
- **Code examples** with syntax highlighting
- **Search functionality** (Nextra built-in)

#### Language Locales
```
locales/
├── en-US/
├── ja/
├── tl/
└── ... (expandable)
```

---

### 4. **prism-exercise** (Port 3003)
**Main Purpose**: Interactive practice platform for coding exercises built with Supabase.

#### Directory Structure
```
apps/prism-exercise/
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── auth/              # Auth flows (Supabase)
│   │   ├── components/        # App components
│   │   └── ...pages
│   ├── lib/                   # Utilities
│   └── middleware.ts          # Auth middleware
├── public/                    # Static assets
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Database schema
└── README.md
```

#### Key Technologies
| Technology | Purpose |
|---|---|
| **Next.js 16** | Framework with Turbopack |
| **Supabase** | Authentication & real-time database |
| **React 19** | UI |
| **Tailwind CSS v4** | Styling |
| **PWA** | Progressive Web App (@ducanh2912/next-pwa) |
| **Speech Recognition** | Voice input (@types/dom-speech-recognition) |

#### Database Schema
- **users** → Auto-created via Supabase trigger
- **profiles** → User profile information
- **exercises** → Exercise content seed data
- **RLS policies** → Row-level security enabled

#### Authentication
- **Supabase Auth** (email/password)
- **Email confirmation disabled** in development (for speed)
- **Auto-profile creation** via trigger

#### Features
- **Interactive exercises** for skill building
- **Voice input** via Web Speech API
- **PWA support** for offline usage
- **Real-time** database with Supabase

#### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

---

### 5. **prism-admin** (Port 3004)
**Main Purpose**: Admin dashboard for system-wide configuration and management.

#### Directory Structure
```
apps/prism-admin/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/         # Admin operations
│   │   │   ├── bootstrap/     # System bootstrap
│   │   │   └── webhooks/      # Webhook handlers
│   │   ├── admin/             # Protected admin routes
│   │   ├── sign-in/           # Sign-in page
│   │   ├── unauthorized/      # Access denied page
│   │   └── page.tsx           # Home
│   ├── lib/                   # Utilities
│   └── middleware.ts          # Auth middleware
├── public/                    # Static assets
└── ADMIN_SETUP.md            # Admin configuration guide
```

#### Key Technologies
| Technology | Purpose |
|---|---|
| **Next.js 16** | Framework |
| **Clerk** | Admin authentication |
| **Firebase Admin SDK** | Firebase Firestore operations |
| **Resend** | Email service |
| **@jdstudio/ui** | Component library |

#### Key Features
1. **System Administration**
   - User role management
   - System configuration

2. **Bootstrap System** (Founder initialization)
   - Creates founder user if missing
   - Sets up initial Firestore collections
   - Route: `/api/bootstrap`

3. **Webhook Management**
   - Process system events
   - Integration with external services

4. **Email Integration** (Resend)
   - Transactional emails
   - Admin notifications

#### Authentication
- **Clerk-based** with founder/admin roles
- **Public metadata** in Clerk stores role information
- **Role hierarchy**: founder > admin > partner > employee

#### Admin Setup Guide
See `ADMIN_SETUP.md` for:
- Setting up admin role in Clerk dashboard
- Programmatic role assignment via Clerk API
- User metadata configuration

---

## 🔗 Integration Map

### Data Flow

```
User Browser
    ↓
prism-dashboard (UI)
    ↓
API Routes (/api/*)
    ├→ Cosmos DB (Rules, Subscriptions)
    ├→ Azure OpenAI (Embeddings)
    ├→ Google Gemini (Components)
    ├→ Mux (Videos)
    └→ Clerk (Auth)
    ↓
prism-mcp-server (Stdio)
    ├→ Cosmos DB (Rules)
    └→ Azure OpenAI (Search)
    ↓
IDEs (Cursor, Windsurf, VS Code, Claude)
```

### Package Dependencies

```
@jeffdev/db (shared)
├── schema.ts      → Zod schemas (Rules, Users, Projects)
├── cosmos.ts      → MongoDB client
└── firebase.ts    → Firebase Admin SDK

@jdstudio/ui (shared)
├── Button, Card, Badge, Input, ProgressBar, DataTable
└── Ghost Glow design system

All apps depend on:
├── @jeffdev/db
├── @jdstudio/ui
├── @repo/eslint-config
└── @repo/typescript-config
```

---

## 🔐 Security & Authentication

### Authentication Methods by App

| App | Auth Method | Roles |
|-----|---|---|
| **prism-dashboard** | Clerk | founder, admin, employee |
| **prism-mcp-server** | API Key + Tier | free, pro, team, enterprise |
| **prism-docs** | None (public) | N/A |
| **prism-exercise** | Supabase | user |
| **prism-admin** | Clerk | founder, admin |

### Secrets Management
- **All secrets** → Doppler (no `.env` files)
- **MCP server** → Validates API key on startup
- **Tier enforcement** → Subscription limits applied
- **Webhooks** → Optional CSRF protection (Mux webhook secret)

---

## 📊 Shared Data Models

### From `@jeffdev/db/schema.ts`

**User Schema**
```typescript
{
  uid: string                              // Firebase Auth UID
  email: string
  displayName?: string
  photoURL?: string
  role: 'founder' | 'admin' | 'partner' | 'employee'
  createdAt: string (ISO 8601)
  updatedAt?: string
}
```

**Rule Schema**
```typescript
{
  id: string
  name: string
  description: string
  category: 'architecture' | 'styling' | 'security' | 'performance' | 'testing' | 'documentation' | 'custom'
  content: string                          // Actual rule text
  isActive: boolean
  priority: number (1-100)
  createdBy: string
  createdAt: string
  updatedAt?: string
}
```

**RuleSet Schema**
```typescript
{
  id: string
  name: string
  description?: string
  rules: string[]                          // Rule IDs
  isPublic: boolean
  createdBy: string
  createdAt: string
}
```

**Project Schema** (Agency)
```typescript
{
  id: string
  slug: string
  name: string
  clientName: string
  clientEmail: string
  status: 'discovery' | 'proposal' | 'in_progress' | 'review' | 'completed' | 'on_hold' | 'cancelled'
  startDate?: string
  endDate?: string
  budget?: number
  assignedTo: string[]                     // User UIDs
  createdAt: string
  updatedAt?: string
}
```

---

## 🚀 Development Workflow

### Starting All Apps
```bash
# Root of monorepo
doppler run -- turbo dev

# Starts in parallel:
# - prism-dashboard on port 3001
# - prism-docs on port 3002
# - prism-exercise on port 3003
# - prism-admin on port 3004
# + prism-mcp-server as standalone
```

### Building & Linting
```bash
doppler run -- turbo build    # Build all
turbo run lint                 # Lint all
turbo run check-types         # Type check
```

### Testing
```bash
# prism-mcp-server
cd apps/prism-mcp-server
npm run test           # Single run with Vitest
npm run test:watch    # Watch mode
```

---

## 📋 Deployment Architecture

### App Deployments
- **prism-dashboard** → Vercel (Next.js)
- **prism-docs** → Vercel (Nextra)
- **prism-exercise** → Vercel (Next.js)
- **prism-admin** → Vercel (Next.js)
- **prism-mcp-server** → Standalone Node.js server (stdio)

### Database Deployments
- **Cosmos DB** → Azure (MongoDB API)
- **Supabase** → Hosted PostgreSQL
- **Firebase** → Google Cloud

### Environment Variables
All via **Doppler** (see `PHASE1_ENV_SETUP.md`):
```
Azure OpenAI:
├── AZURE_OPENAI_ENDPOINT
├── AZURE_OPENAI_API_KEY
└── AZURE_OPENAI_DEPLOYMENT_NAME

Mux (Video):
├── MUX_TOKEN_ID
└── MUX_TOKEN_SECRET

Cosmos DB:
├── MONGODB_URI
└── COSMOS_DATABASE_NAME

Clerk:
├── NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
└── CLERK_SECRET_KEY

Supabase:
├── NEXT_PUBLIC_SUPABASE_URL
└── NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

App URLs:
├── NEXT_PUBLIC_APP_URL
├── NEXT_PUBLIC_PRISM_URL
└── NEXT_PUBLIC_DOCS_URL
```

---

## 🎯 Key Use Cases & Workflows

### Use Case 1: Developer Using MCP Server
1. Developer installs Prism MCP in Cursor/Windsurf
2. MCP server connects to prism-dashboard via API key
3. MCP fetches rules from Cosmos DB
4. As developer codes, MCP validates patterns
5. If rule violation detected, MCP provides guidance

### Use Case 2: Creating & Publishing Rules
1. Admin logs into prism-dashboard
2. Creates rule in Brand Wizard
3. Rule stored in Cosmos DB
4. MCP server picks up rule on next sync
5. Rule available to all connected IDEs

### Use Case 3: Video-to-Context Extraction
1. User uploads architecture video in prism-dashboard
2. Mux processes video, generates transcript
3. Azure OpenAI extracts rules from transcript
4. Rules stored automatically
5. Searchable via MCP server

### Use Case 4: Learning with Exercises
1. User signs up on prism-exercise
2. Completes interactive coding exercises
3. Speech recognition for voice input
4. Progress tracked in Supabase
5. Can work offline with PWA

---

## 📈 Subscription & Monetization

### Tier Structure

| Feature | Free | Pro | Team | Enterprise |
|---------|------|-----|------|-----------|
| Rules | 5 | ∞ | ∞ | ∞ |
| Projects | 1 | 10 | ∞ | ∞ |
| IDE Sync | ❌ | ✅ | ✅ | ✅ |
| Team Members | - | - | 10 | ∞ |
| API Keys | 0 | 1 | 5 | ∞ |
| AI Generations/mo | 10 | 500 | 2000 | ∞ |
| **Price/month** | FREE | $18 | $54 | Custom |

### Payment Integration
- **PayPal** for subscription processing
- **Webhook handlers** for subscription events
- **Tier enforcement** in MCP server (limits API access)

---

## 🔍 Key Files Reference

### Configuration
- `turbo.json` - Turborepo task definitions
- `.github/copilot-instructions.md` - Project guidelines
- `PRISM_PROJECT_STRUCTURE.md` - Architectural rules
- `PHASE1_ENV_SETUP.md` - Environment setup

### Database Schemas
- `packages/db/src/schema.ts` - Zod schemas (single source of truth)
- `packages/db/src/cosmos.ts` - MongoDB client
- `apps/prism-exercise/supabase/migrations/001_initial_schema.sql` - Supabase schema

### Documentation
- `apps/prism-dashboard/README.md` - Dashboard guide
- `apps/prism-mcp-server/CHANGELOG.md` - Version history
- `apps/prism-admin/ADMIN_SETUP.md` - Admin guide
- `apps/prism-exercise/SUPABASE_SETUP.md` - Supabase setup

### Entry Points
- `apps/prism-dashboard/src/app/layout.tsx` - Dashboard layout
- `apps/prism-mcp-server/src/index.ts` - MCP server
- `apps/prism-docs/theme.config.tsx` - Docs theme
- `apps/prism-exercise/src/app/page.tsx` - Exercise home

---

## 🛠️ Troubleshooting

### Issue: MCP Server Won't Connect
**Check**:
1. `MONGODB_URI` and `COSMOS_DATABASE_NAME` set
2. Azure Cosmos DB accessible
3. API key valid (if using authenticated mode)

### Issue: Dashboard Rules Not Syncing
**Check**:
1. Rules in Cosmos DB have `isPublic: true`
2. MCP server restarted after rule creation
3. Category matches MCP tool filter

### Issue: Video Transcription Failed
**Check**:
1. Mux webhook signature matches
2. Azure OpenAI credentials valid
3. Storage quota not exceeded

### Issue: Supabase Auth Issues
**Check**:
1. Email confirmation disabled (dev)
2. Site URL configured correctly
3. Anon key has correct permissions

---

## 📚 Next Steps & Roadmap

Based on PHASE2 documents:
- **Phase 3**: Enhanced video transcript search with semantic embeddings
- **AI improvements**: Better rule extraction from videos
- **Team features**: Multi-user rule sets and shared contexts
- **Mobile support**: iOS/Android apps for exercise platform
- **Enterprise SaaS**: Custom deployment options

---

## Summary

The **Prism Context Engine** is a sophisticated, multi-app system designed to:

✅ **Enforce architectural rules** via MCP servers in IDEs  
✅ **Manage subscriptions** with tiered pricing  
✅ **Extract knowledge** from videos automatically  
✅ **Generate components** with AI  
✅ **Provide documentation** multi-linguistically  
✅ **Teach developers** with interactive exercises  
✅ **Administer systems** through a dedicated admin panel  

All built on **Next.js 16**, **React 19**, **Tailwind CSS v4**, **Azure Cosmos DB**, and **Clerk Auth**.
