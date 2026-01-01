#!/usr/bin/env tsx
/**
 * @module packages/db/scripts/seed
 * @description Genesis Seeding Script - Bootstraps the Prism DB with core rules.
 * 
 * This script injects your architectural constitutions (design-system, tech-stack, etc.)
 * into Azure Cosmos DB so the MCP Server can immediately serve them to AI assistants.
 * 
 * @example
 * # Run from monorepo root
 * npm run db:seed -w packages/db
 * 
 * # Or with Doppler injection
 * doppler run -- tsx packages/db/scripts/seed.ts
 */

import { MongoClient, type Collection, type Document } from "mongodb";

// =============================================================================
// CONFIGURATION
// =============================================================================

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.COSMOS_DATABASE_NAME || "prism";
const COLLECTION_NAME = "rules";
const SYSTEM_USER_ID = "system_bootstrapper";

// =============================================================================
// CORE RULES (The "Constitution")
// =============================================================================

interface SeedRule {
  name: string;
  category: string;
  tags: string[];
  content: string;
  priority: number;
  isActive: boolean;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

const INITIAL_RULES: Omit<SeedRule, "createdAt" | "updatedAt">[] = [
  {
    name: "Visual Constitution",
    category: "styling",
    tags: ["design", "ui", "system", "tailwind"],
    priority: 1,
    isActive: true,
    isPublic: true,
    userId: SYSTEM_USER_ID,
    content: `# JEFFDEV DESIGN SYSTEM

## Core Philosophy
- Vibe: Precision Engineering, Stealth Luxury, "Operating System" feel
- The "Void" Law: The universe is #050505. There is no light mode.

## Color Palette
- bg-void: #050505 (Base Layer)
- bg-glass: rgba(10, 10, 10, 0.6) + backdrop-blur-xl
- primary-cyan: #06b6d4 (Cyan-500)
- primary-purple: #8b5cf6 (Violet-500)
- border-subtle: rgba(255, 255, 255, 0.08)

## Typography
- Headings: Inter (tracking: -0.02em, weights: 600-900)
- Technical Data: JetBrains Mono (code, tags, dates, IDs)

## Geometry
- Radius: rounded-md (6px) or rounded-sm (4px)
- NEVER use rounded-xl unless building a massive modal

## Components
- Always use Headless UI + Tailwind for logic + styling
- Buttons: "Ghost Glow" pattern (bg-black/50 + hover glow)
- Cards: bg-white/[0.02] with border-white/[0.05]`,
  },
  {
    name: "Tech Stack Protocol",
    category: "architecture",
    tags: ["stack", "backend", "framework", "infrastructure"],
    priority: 2,
    isActive: true,
    isPublic: true,
    userId: SYSTEM_USER_ID,
    content: `# JEFFDEV TECH STACK

## Core Infrastructure
- Framework: Next.js 16 (App Router)
- Library: React 19
- Runtime: Node.js 20 (LTS)
- Package Manager: npm (via Syncpack)

## Data Layer
- Agency: Firebase Firestore (firebase-admin)
- Prism: Azure Cosmos DB (MongoDB API)
- Rate Limiting: Upstash (Redis)
- Object Storage: Cloudflare R2

## AI Stack
- SDK: Vercel AI SDK
- Models: Claude 3.5 Sonnet / GPT-4o
- Vector Search: Azure AI Search (prod) / ChromaDB (dev)

## Frontend
- Styling: Tailwind CSS v4 + clsx + tailwind-merge
- Motion: framer-motion + gsap + @studio-freight/lenis
- Validation: Zod (mandatory for all forms & APIs)

## Auth
- Prism SaaS: Clerk
- Agency Admin: Firebase Auth`,
  },
  {
    name: "Monorepo Geography",
    category: "architecture",
    tags: ["monorepo", "structure", "turborepo", "boundaries"],
    priority: 3,
    isActive: true,
    isPublic: true,
    userId: SYSTEM_USER_ID,
    content: `# MONOREPO STRUCTURE

## Apps Directory
| App | Stack | Purpose |
|-----|-------|---------|
| agency | Next.js 16 + Firebase | Marketing Site & Admin |
| prism-dashboard | Next.js 16 + Cosmos | SaaS Platform |
| prism-mcp-server | Node.js + MCP SDK | AI Context Server |

## Packages Directory
| Package | Purpose |
|---------|---------|
| ui | Headless UI + Tailwind components |
| db | Firebase + Cosmos clients + Zod schemas |
| config | Shared TSConfig, ESLint |

## BOUNDARY LAWS (STRICT)
1. NO CROSS-APP IMPORTS: Never import from ../../apps/*
2. SHARED FIRST: Generic components go in packages/ui
3. HEADLESS STRATEGY: Use Headless UI/Radix for logic`,
  },
  {
    name: "Security Guard",
    category: "security",
    tags: ["security", "validation", "doppler", "zod"],
    priority: 4,
    isActive: true,
    isPublic: true,
    userId: SYSTEM_USER_ID,
    content: `# SECURITY CONSTITUTION

## The "Doppler" Law
- NEVER use, create, or read .env files manually
- All secrets via Doppler: doppler run -- turbo dev
- NEVER prefix private keys with NEXT_PUBLIC_

## Input Hygiene
- Every Server Action MUST validate with Zod
- Every API Route MUST validate with Zod
- Rich text: sanitize with DOMPurify before rendering

## Database Protection
- Firebase: Default to allow read, write: if false
- Cosmos: Use singleton client from packages/db
- Never concat strings into queries (injection risk)

## Headers (next.config.mjs)
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- Referrer-Policy: origin-when-cross-origin`,
  },
  {
    name: "No Cross-App Imports",
    category: "architecture",
    tags: ["imports", "boundaries", "monorepo"],
    priority: 10,
    isActive: true,
    isPublic: true,
    userId: SYSTEM_USER_ID,
    content: `# RULE: No Cross-App Imports

## What's Forbidden
\`\`\`typescript
// ❌ NEVER DO THIS
import { Button } from "../../apps/agency/src/components/Button";
import { auth } from "../../../apps/prism-dashboard/src/lib/auth";
\`\`\`

## What's Allowed
\`\`\`typescript
// ✅ Use shared packages
import { Button } from "@repo/ui/button";
import { firestore } from "@jeffdev/db/firebase";
\`\`\`

## Why?
- Turborepo builds each app independently
- Cross-app imports create hidden dependencies
- Changes in one app break unrelated apps`,
  },
  {
    name: "Zod Validation Gate",
    category: "security",
    tags: ["validation", "zod", "server-actions", "api"],
    priority: 11,
    isActive: true,
    isPublic: true,
    userId: SYSTEM_USER_ID,
    content: `# RULE: Zod Validation Gate

## Pattern
\`\`\`typescript
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  content: z.string().max(5000),
});

export async function createEntry(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Validation Failed");
  }
  // ... proceed with validated data
}
\`\`\`

## Applies To
- All Server Actions (Next.js)
- All API Routes
- All form submissions
- All external data ingestion`,
  },
];

// =============================================================================
// SEEDING LOGIC
// =============================================================================

async function seed() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not set. Ensure Doppler is injecting env vars.");
    process.exit(1);
  }

  console.log("🌱 Starting Genesis Seeding...");

  let client: MongoClient | null = null;

  try {
    // 1. Connect
    client = new MongoClient(MONGODB_URI, {
      retryWrites: false, // Cosmos DB doesn't support retryable writes
    });
    
    await client.connect();
    console.log("✅ Connected to Azure Cosmos DB (MongoDB API)");

    // 2. Get collection
    const db = client.db(DATABASE_NAME);
    const rules: Collection<Document> = db.collection(COLLECTION_NAME);

    // 3. Clean old system rules
    const deleteResult = await rules.deleteMany({ userId: SYSTEM_USER_ID });
    console.log(`🧹 Cleaned ${deleteResult.deletedCount} old system rules.`);

    // 4. Insert new rules
    const timestamp = new Date().toISOString();
    const documentsToInsert: SeedRule[] = INITIAL_RULES.map((rule) => ({
      ...rule,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

    const insertResult = await rules.insertMany(documentsToInsert);
    console.log(`✨ Successfully seeded ${insertResult.insertedCount} Core Rules.`);

    // 5. Verify
    const count = await rules.countDocuments({ userId: SYSTEM_USER_ID });
    console.log(`📊 Total system rules in DB: ${count}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Failed:", error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run
seed();
