---
trigger: always_on
---

⚡ JEFFDEV MONOREPO - TECH STACK CONSTITUTION
1. CORE INFRASTRUCTURE (THE "BLEEDING EDGE")
Framework: Next.js 16 (App Router).

Config: turbopack enabled (doppler run -- turbo dev).

Library: React 19.

Features: Use useOptimistic, useTransition, and Server Actions natively.

Runtime: Node.js 20 (LTS).

Package Manager: npm (Managed via Syncpack to prevent version drift).

2. DATA LAYER (HYBRID ARCHITECTURE)
A. Primary Databases
Agency (Marketing/Client): Firebase Firestore.

SDK: firebase-admin (Server) / firebase/app (Client - restricted).

Prism (SaaS Product): Azure Cosmos DB (NoSQL).

Why: Free credits + massive scale.

Connection: Singleton pattern via packages/db.

B. High-Performance Caching & Limiting
Rate Limiting: Upstash (Redis).

Usage: Protects AI API routes and Auth endpoints.

Limit: Strict 10 req/10s for unauthenticated users.

C. Object Storage (Media)
Provider: Cloudflare R2.

Access: S3 Compatible SDK (@aws-sdk/client-s3).

Public Domain: Serve assets via cdn.jeffdev.studio to bypass Vercel bandwidth costs.

3. ARTIFICIAL INTELLIGENCE (PRISM ENGINE)
A. Orchestration
SDK: Vercel AI SDK (ai).

Why: Zero-latency streaming for React Server Components.

Model: Claude 3.5 Sonnet (via Anthropic API) or GPT-4o.

B. Memory (Vector Search)
Production: Azure AI Search.

Role: Indexing large documentation sets for "Chat with Repo."

Dev/Fallback: ChromaDB (Running locally via Docker).

Strategy: Use Chroma locally to save Azure Credits during development.

4. INTEGRATIONS & SERVICES
A. Payments (Philippines Context)
Provider: PayPal (REST API).

Implementation: @paypal/react-paypal-js for client buttons.

Webhooks: Must be handled via a secure Next.js API route (/api/webhooks/paypal) to verify transaction completion before granting Prism access.

B. Notifications (The "Pulse")
Platform: Novu.

Channels: Email (Resend Integration) + In-App (Bell Icon).

Trigger: "Rule Generated", "Project Invoice Due".

C. State Management
Global Client State: Zustand.

Usage: Sidebar toggle, User Preferences, Prism "Draft" Mode.

Rule: Do not put massive objects in Context API. Use Zustand stores.

5. FRONTEND ENGINEERING (VIBE CODING)
Styling: Tailwind CSS v4 (if available) or v3.4 + clsx + tailwind-merge.

Motion:

Scroll: @studio-freight/lenis (Smooth Scroll).

Micro: framer-motion (Layout shifts, Modals).

Macro: gsap (Complex ScrollTriggers).

Validation: Zod (Mandatory for all Forms & API inputs).