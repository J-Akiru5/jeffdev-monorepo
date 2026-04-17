# Prism Apps Development Guide

This skill covers development of the Prism SaaS ecosystem: **prism-dashboard**, **prism-mcp-server**, **prism-docs**, **prism-exercise**, and **prism-admin**.

## 🎯 System Overview

Prism is a "Context-as-a-Service" platform for developers. The architecture:

```
prism-dashboard (SaaS Portal)
  ↓ Creates/Manages Rules
  ↓ Uploads Videos
  ↓
Cosmos DB (NoSQL)
  ↓
prism-mcp-server (Context Server)
  ↓ Serves Rules to IDEs via MCP protocol
  ↓
IDE Tools (Cursor, Windsurf, VS Code, Claude)
```

## 📱 App-by-App Architecture

### 1. **prism-dashboard** (Next.js 16 + Clerk + Cosmos DB)
**Port:** 3001  
**Purpose:** SaaS platform where developers manage architectural rules and context

#### Key Features
- **Brand Wizard** (5-step form) → Export as `.cursorrules`
- **Video Upload** → Auto-extract rules via Azure OpenAI
- **AI Component Generator** → Generate code using Gemini
- **Billing** → Stripe/PayPal integration with subscription tiers

#### Directory Structure
```
apps/prism-dashboard/src/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── login/page.tsx           # Clerk auth
│   ├── dashboard/page.tsx       # SaaS portal (protected)
│   ├── api/
│   │   ├── webhooks/stripe.ts   # Payment webhooks
│   │   ├── auth/clerk/route.ts  # Clerk sync
│   │   └── rules/[id].ts        # Rule CRUD
│   └── actions/                 # Server actions
├── components/
│   ├── brand-wizard/            # Step-by-step form
│   ├── video-upload/            # Mux integration
│   ├── ai-generator/            # Gemini integration
│   └── dashboard/               # Portal UI
├── lib/
│   ├── cosmos.ts                # Cosmos DB singleton
│   ├── clerk.ts                 # Auth utilities
│   └── gemini.ts                # AI integration
└── types/
    └── index.ts                 # TypeScript definitions
```

#### Key Patterns

**Cosmos DB Singleton:**
```typescript
// lib/cosmos.ts
import { CosmosClient } from "@azure/cosmos";
let container: Container | null = null;

export async function getPrismContainer() {
  if (container) return container;
  
  const client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT!,
    key: process.env.COSMOS_KEY!,
  });
  
  const db = client.database(process.env.COSMOS_DB!);
  container = db.container("rules");
  return container;
}
```

**Server Actions (Video Upload → Rule Extraction):**
```typescript
// app/actions/extract-rules.ts
'use server';

import { z } from "zod";
import { OpenAIClient } from "@azure/openai";

const schema = z.object({
  videoUrl: z.string().url(),
  projectId: z.string(),
});

export async function extractRulesFromVideo(input: unknown) {
  const { videoUrl, projectId } = schema.parse(input);
  
  // 1. Fetch video transcript via Mux
  const transcript = await getTranscript(videoUrl);
  
  // 2. Generate embeddings via Azure OpenAI
  const client = new OpenAIClient({
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_KEY,
  });
  
  const embedding = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: transcript,
  });
  
  // 3. Store in Cosmos with embedding vector
  const container = await getPrismContainer();
  await container.items.create({
    id: crypto.randomUUID(),
    projectId,
    content: transcript,
    embedding: embedding.data[0].embedding,
    createdAt: new Date().toISOString(),
  });
  
  return { success: true };
}
```

**Clerk Authentication with Role Sync:**
```typescript
// lib/clerk.ts
import { auth } from "@clerk/nextjs/server";

export async function requireAuth(roles?: string[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  const container = await getPrismContainer();
  const user = await container
    .items.query({
      query: "SELECT * FROM users WHERE id = @userId",
      parameters: [{ name: "@userId", value: userId }],
    })
    .fetchAll();
  
  if (roles && !roles.includes(user[0]?.role)) {
    throw new Error("Forbidden");
  }
  
  return user[0];
}
```

#### Subscription Tiers
| Tier | Price | Rules | Videos | API Calls/mo |
|------|-------|-------|--------|-------------|
| Free | $0 | 5 | 1 | 1,000 |
| Pro | $29/mo | Unlimited | 20 | 100,000 |
| Team | $99/mo | Unlimited | Unlimited | 1M |
| Enterprise | Custom | All | All | All |

---

### 2. **prism-mcp-server** (Node.js 20 + MCP SDK)
**Purpose:** Model Context Protocol server that serves rules to IDE plugins

#### Directory Structure
```
apps/prism-mcp-server/src/
├── server.ts                # MCP transport setup
├── handlers/
│   ├── list-rules.ts        # GET /rules
│   ├── get-rule.ts          # GET /rules/:id
│   ├── search-rules.ts      # POST /search (semantic)
│   └── validate-code.ts     # POST /validate
├── services/
│   ├── cosmos.ts            # DB access
│   ├── embeddings.ts        # Vector search
│   └── code-validator.ts    # Pattern checking
└── types/
    └── index.ts
```

#### Key Patterns

**MCP Server Setup:**
```typescript
// server.ts
import Anthropic from "@anthropic-sdk/sdk";
import { StdioServerTransport } from "@anthropic-sdk/sdk/lib/cjs/index.js";

const server = new Anthropic();
const transport = new StdioServerTransport();

// Tools
server.tools.register({
  name: "list_rules",
  description: "List all architectural rules for a project",
  input_schema: {
    type: "object",
    properties: {
      projectId: { type: "string" },
    },
    required: ["projectId"],
  },
  handler: async (input) => {
    const rules = await listRules(input.projectId);
    return { rules };
  },
});

await server.connect(transport);
```

**Semantic Search (Vector Embeddings):**
```typescript
// services/embeddings.ts
export async function semanticSearch(query: string, limit = 5) {
  const container = await getPrismContainer();
  
  // 1. Get embedding for query
  const queryEmbedding = await generateEmbedding(query);
  
  // 2. Use Cosmos vector search
  const results = await container.items
    .query({
      query: `
        SELECT * FROM rules 
        WHERE VectorDistance(embedding, @embedding) < @threshold
        ORDER BY VectorDistance(embedding, @embedding)
        OFFSET 0 LIMIT @limit
      `,
      parameters: [
        { name: "@embedding", value: queryEmbedding },
        { name: "@threshold", value: 0.7 },
        { name: "@limit", value: limit },
      ],
    })
    .fetchAll();
  
  return results.resources;
}
```

**Code Pattern Validation:**
```typescript
// services/code-validator.ts
export function validateCode(code: string, rule: Rule): ValidationResult {
  const patterns = rule.patterns || [];
  
  const issues: ValidationIssue[] = [];
  
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.regex, 'g');
    const matches = code.match(regex);
    
    if (pattern.shouldMatch && !matches) {
      issues.push({
        type: 'error',
        message: `Code should follow pattern: ${pattern.description}`,
        pattern: pattern.regex,
      });
    }
    
    if (pattern.shouldNotMatch && matches) {
      issues.push({
        type: 'error',
        message: `Code violates pattern: ${pattern.description}`,
        pattern: pattern.regex,
      });
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
}
```

---

### 3. **prism-docs** (Nextra 4)
**Port:** 3002  
**Purpose:** Multi-language documentation site

#### Structure
```
apps/prism-docs/
├── content/
│   ├── docs/
│   │   ├── getting-started.mdx
│   │   ├── rules/index.mdx
│   │   ├── api/index.mdx
│   │   └── faq.mdx
│   ├── en-US/
│   ├── ja/
│   └── tl/
├── theme.config.tsx         # Nextra theme config
└── app/
    └── layout.tsx           # Next.js layout
```

#### Key Features
- Multi-language support (en-US, ja, tl)
- API documentation
- Interactive examples
- AI-powered search (via Algolia)

---

### 4. **prism-exercise** (Next.js 16 + Supabase)
**Port:** 3003  
**Purpose:** Interactive coding practice platform

#### Key Features
- **Speech Recognition** → Voice commands for exercises
- **Real-time Sync** → Supabase Realtime
- **PWA Support** → Offline mode
- **Video Integration** → Embedded lessons via Mux

#### Database (Supabase/PostgreSQL)
```sql
CREATE TABLE exercises (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  difficulty ENUM('beginner', 'intermediate', 'advanced'),
  starter_code TEXT,
  solution_code TEXT,
  test_cases JSONB,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE submissions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  exercise_id UUID REFERENCES exercises(id),
  code TEXT,
  passed_tests INT,
  total_tests INT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 5. **prism-admin** (Next.js 16 + Firebase)
**Port:** 3004  
**Purpose:** System administration dashboard

#### Key Pages
- `/admin/bootstrap` → Initialize system
- `/admin/users` → User management
- `/admin/rules` → Rule library curation
- `/admin/subscriptions` → Billing oversight
- `/admin/logs` → System audit trail

---

## 🔄 Common Development Tasks

### Task 1: Add a New Rule Category

```typescript
// Add to packages/db/src/schema.ts
export const RuleSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  category: z.enum([
    'architecture',
    'styling',
    'security',
    'performance',
    'testing', // NEW
  ]),
  content: z.string(),
  createdAt: z.string().datetime(),
});

// apps/prism-dashboard/app/actions/create-rule.ts
'use server';
import { RuleSchema } from '@jeffdev/db';

export async function createRule(data: unknown) {
  const rule = RuleSchema.parse(data);
  const container = await getPrismContainer();
  const result = await container.items.create(rule);
  return result.resource;
}
```

### Task 2: Deploy MCP Server to Production

```bash
# Build standalone
cd apps/prism-mcp-server
npm run build

# Deploy to Vercel as serverless function or Edge Function
# OR deploy to your own Node.js server

# Test connection from IDE
# In Cursor/Windsurf settings:
# "MCP Servers": [{ 
#   "name": "prism",
#   "command": "node /path/to/server.js"
# }]
```

### Task 3: Set Up Video → Rules Pipeline

```typescript
// apps/prism-dashboard/app/actions/process-video.ts
'use server';

import { muxClient } from '@/lib/mux';
import { openaiClient } from '@/lib/openai';

export async function processVideo(videoId: string) {
  // 1. Get transcript from Mux
  const transcript = await muxClient.video.getTranscript(videoId);
  
  // 2. Extract key concepts via GPT
  const completion = await openaiClient.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [{
      role: 'user',
      content: `Extract architectural rules from this transcript:\n\n${transcript}`,
    }],
  });
  
  // 3. Parse rules and store
  const rules = parseRules(completion.choices[0].message.content);
  const container = await getPrismContainer();
  
  for (const rule of rules) {
    await container.items.create({
      ...rule,
      videoId,
      createdAt: new Date().toISOString(),
    });
  }
  
  return rules;
}
```

---

## 🚨 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Cosmos connection timeout | Missing env vars | Check Doppler: `COSMOS_ENDPOINT`, `COSMOS_KEY` |
| MCP server not responding | Stdio transport error | Check `npx prism-mcp-server` runs without error |
| Video upload fails | Mux credentials | Verify `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET` |
| Rules not appearing in IDE | MCP handler not registered | Check `server.tools.register()` calls |
| Embeddings mismatch | Dimension mismatch (768 vs 3072) | Ensure consistent embedding model |

---

## 📚 Related Documentation

- [PRISM_APPS_COMPREHENSIVE_GUIDE.md](../../PRISM_APPS_COMPREHENSIVE_GUIDE.md) — Full architecture
- [Tech Stack](../rules/tech-stack.md) — Dependencies & versions
- [Security Guard](../rules/security-guard.md) — Input validation & rate limiting
