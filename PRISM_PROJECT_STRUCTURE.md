# Project Structure Guide - Prism Engine

## Overview

This guide outlines how to structure your JeffDev monorepo using the Prism Context Engine for architectural governance and code validation.

## Prism Engine Context

**Prism Context Engine** is a sophisticated AI context governance system that:
- Enforces architectural rules through MCP (Model Context Protocol)
- Provides real-time code validation
- Manages project-wide coding standards
- Enables semantic search across video transcripts

## Current Architecture

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
│  ├── eslint-config   → Shared ESLint configuration              │
│  ├── typescript-config→ Shared TypeScript configuration         │
│  └── prism-cli       → CLI tools for Prism Engine               │
└─────────────────────────────────────────────────────────────────┘
```

## Core Architectural Rules (Enforced by Prism)

### 1. Visual Constitution (Priority: 1)
- **Vibe**: Precision Engineering, Stealth Luxury, "Operating System" feel
- **Base Color**: bg-void: #050505 (no light mode)
- **Primary Colors**: Cyan-500 (#06b6d4), Violet-500 (#8b5cf6)
- **Typography**: Inter for headings, JetBrains Mono for technical data
- **Components**: Headless UI + Tailwind with "Ghost Glow" pattern

### 2. Tech Stack Protocol (Priority: 2)
- **Framework**: Next.js 16 (App Router)
- **Library**: React 19
- **Runtime**: Node.js 20 (LTS)
- **Styling**: Tailwind CSS v4 + clsx + tailwind-merge
- **Validation**: Zod (mandatory for all forms & APIs)
- **Auth**: Clerk (Prism SaaS), Firebase Auth (Agency)

### 3. Monorepo Geography (Priority: 3)
- **Apps Directory**: Independent applications
- **Packages Directory**: Shared utilities and components
- **Boundary Laws**: NO cross-app imports, shared components in packages/ui

### 4. Security Guard (Priority: 4)
- **Secrets Management**: Doppler only (no .env files)
- **Input Validation**: Zod for all Server Actions and API routes
- **Database Protection**: Singleton clients, no string concatenation in queries

### 5. No Cross-App Imports (Priority: 10)
- **Forbidden**: Importing from `../../apps/*`
- **Allowed**: Importing from shared packages (`@repo/ui/*`, `@jeffdev/db/*`)

## Using Prism Engine for Development

### MCP Tools Available

1. **get_architectural_rules**
   ```typescript
   // Fetch coding standards before writing code
   const rules = await get_architectural_rules({
     category: "architecture", // or "styling", "security", "performance"
     tag: "design" // optional filter
   });
   ```

2. **validate_code_pattern**
   ```typescript
   // Validate code against architectural rules
   const validation = await validate_code_pattern({
     code: "your code here",
     context: "component or feature description"
   });
   ```

3. **search_video_transcript**
   ```typescript
   // Search video transcripts for architectural discussions
   const results = await search_video_transcript({
     query: "TypeScript patterns",
     projectId: "optional-project-id",
     limit: 5
   });
   ```

## Development Workflow

### 1. Before Writing Code
```bash
# Get architectural rules for your context
mcp0_get_architectural_rules --category=architecture --tag=design
```

### 2. During Development
```bash
# Validate your code patterns
mcp0_validate_code_pattern --code="your-code" --context="component-description"
```

### 3. When Stuck
```bash
# Search video transcripts for solutions
mcp0_search_video_transcript --query="your-problem" --limit=3
```

## File Structure Best Practices

### Apps Structure
```
apps/[app-name]/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # App-specific components
│   ├── lib/             # App-specific utilities
│   └── types/           # App-specific types
├── public/              # Static assets
├── package.json
└── next.config.mjs
```

### Packages Structure
```
packages/[package-name]/
├── src/
│   ├── index.ts         # Main exports
│   ├── components/      # Reusable components
│   ├── lib/            # Shared utilities
│   └── types/          # Shared types
├── package.json
└── README.md
```

## Component Guidelines

### UI Components (packages/ui)
```typescript
// ✅ Correct: Headless UI + Tailwind
import { Button as HeadlessButton } from '@headlessui/react';
import { cn } from '../lib/utils';

export function Button({ variant = 'primary', className, ...props }) {
  return (
    <HeadlessButton
      className={cn(
        'px-4 py-2 rounded-md transition-all duration-200',
        variant === 'primary' && 'bg-cyan-500 text-white hover:bg-cyan-600',
        variant === 'ghost' && 'bg-black/50 hover:bg-black/70',
        className
      )}
      {...props}
    />
  );
}
```

### App-Specific Components
```typescript
// ✅ Correct: Use shared UI components
import { Button, Card } from '@jdstudio/ui';

export function HeroSection() {
  return (
    <Card variant="interactive">
      <Button variant="cyan">Get Started</Button>
    </Card>
  );
}
```

## Database Patterns

### Firebase (Agency App)
```typescript
import { firestore } from '@jeffdev/db/firebase';
import { z } from 'zod';

const ClientSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  project: z.string(),
});

export async function createClient(data: unknown) {
  const parsed = ClientSchema.parse(data);
  return await firestore.collection('clients').add(parsed);
}
```

### Cosmos DB (Prism Apps)
```typescript
import { cosmos } from '@jeffdev/db/cosmos';
import { z } from 'zod';

const RuleSchema = z.object({
  name: z.string(),
  category: z.enum(['architecture', 'styling', 'security', 'performance']),
  content: z.string(),
  priority: z.number(),
});

export async function createRule(data: unknown) {
  const parsed = RuleSchema.parse(data);
  return await cosmos.db.collection('rules').insertOne(parsed);
}
```

## Security Best Practices

### Server Actions
```typescript
import { z } from 'zod';

const FormSchema = z.object({
  email: z.string().email(),
  message: z.string().min(10),
});

export async function submitContact(formData: FormData) {
  const data = Object.fromEntries(formData);
  const parsed = FormSchema.safeParse(data);
  
  if (!parsed.success) {
    return { error: 'Invalid input' };
  }
  
  // Process validated data
}
```

### API Routes
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const QuerySchema = z.object({
  search: z.string().optional(),
  limit: z.number().min(1).max(50).default(10),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = Object.fromEntries(searchParams);
  
  const parsed = QuerySchema.safeParse(query);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  }
  
  // Process validated query
}
```

## Environment Configuration

### Doppler Setup
```bash
# Install Doppler CLI
npm install -g doppler

# Setup project
doppler setup

# Run with secrets
doppler run -- turbo dev
```

### Never Use .env Files
```typescript
// ❌ NEVER DO THIS
const apiKey = process.env.NEXT_PUBLIC_API_KEY;

// ✅ USE DOPPLER
const apiKey = process.env.API_KEY; // No NEXT_PUBLIC_ prefix
```

## Testing Strategy

### Unit Tests
```typescript
import { describe, it, expect } from 'vitest';
import { Button } from '@jdstudio/ui';

describe('Button', () => {
  it('renders with correct variant', () => {
    // Test component behavior
  });
});
```

### Integration Tests
```typescript
import { describe, it, expect } from 'vitest';
import { createClient } from '../lib/clients';

describe('Client Creation', () => {
  it('creates client with valid data', async () => {
    // Test database operations
  });
});
```

## Deployment Considerations

### Build Process
```bash
# Build all apps
turbo build

# Build specific app
turbo build --filter=agency
```

### Environment Variables
- All secrets managed via Doppler
- No hardcoded values
- Proper CORS and security headers in next.config.mjs

## Monitoring and Observability

### Error Tracking
- Use structured logging
- Implement error boundaries
- Monitor performance metrics

### Database Monitoring
- Firebase: Use Firebase console
- Cosmos: Use Azure Monitor
- Rate limiting: Upstash Redis

## Conclusion

This structure ensures:
- **Consistency**: Enforced by Prism Engine rules
- **Scalability**: Proper separation of concerns
- **Security**: Built-in validation and secret management
- **Maintainability**: Clear boundaries and shared packages

The Prism Context Engine provides real-time validation and guidance to ensure all code follows these architectural principles.

---

*Generated using Prism Context Engine v1.0.0*
