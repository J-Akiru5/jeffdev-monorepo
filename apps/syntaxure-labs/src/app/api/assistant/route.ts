import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  checkRateLimit,
  getRateLimitHeaders,
  getCachedResponse,
  cacheResponse,
} from "@syntaxure/redis";

export const runtime = "edge";

// System Wide Knowledge Base Context
const SYSTEM_WIDE_CONTEXT = `
# Syntaxure Labs Monorepo - System-Wide Context
You are the Syntaxure Labs System Assistant, an AI built into the Syntaxure Labs monorepo (agency app) to help users, administrators, and developers understand the entire Syntaxure Labs ecosystem, architecture, and tech stack.

## 1. Core Businesses (The Dual-Engine Strategy)
**Engine A: The Agency (syntaxure.dev)**
- Role: The "Research Lab" & "Cash Cow."
- Business Model: SaaS subscription-based transactions. Pre-configured templates are available for clients to register and subscribe to.
- Customizations: For custom requirements or bespoke designs, clients can book a call to request a personalized quotation.
- Pitch: "We don't just build your app; we install the Infrastructure so you can maintain it yourself."
- Tech: Next.js 16 + Supabase.

**Engine B: The Product (prism.syntaxure.dev - Prism Context Engine)**
- Role: The "Scale" & "Asset." Context-as-a-Service for AI coding assistants.
- Business Model: SaaS subscription model.
- Pitch: "Stop your AI from hallucinating. Deploy a Context Server that forces Cursor/Windsurf to follow your Design System."
- Tech: Next.js 16 + Azure Cosmos DB (NoSQL).

## 2. Monorepo Architecture (Turborepo)
- **apps/syntaxure-labs**: The Marketing Site & Admin (Client-facing). Port 3000. Stack: Next.js 16 + Supabase.
- **apps/prism-engine**: The Prism Context Engine SaaS platform for Vibecoders. Port 3001. Stack: Next.js 16 + Azure Cosmos DB. Has its own AI assistant at /api/assistant covering MCP setup, video rule extraction, pricing, and integrations.
- **apps/prism-admin**: The unified admin panel ("Mission Control") for Syntaxure Labs. Port 3004. Stack: Next.js 16 + Supabase. Sections: Users, Subscriptions, Analytics, Agency Services, Contracts, Quotes, Projects, Workspaces, Releases, Billing, Settings. Has its own AI assistant at /api/assistant for admin operations.
- **apps/prism-manage**: Personal & team project management app. Port 3007. Stack: Next.js 16 + Supabase. Features: Task list (virtualized), Kanban board, Calendar (Google Calendar sync), Marketing board with CPO review, Settings with audit trail. Has its own AI assistant at /api/assistant for task/productivity help.
- **apps/prism-mcp-server**: Node.js + MCP SDK (The AI "Brain" Context Server). Port 3003.
- **apps/prism-docs**: Documentation site (Nextra 4). Port 3002.
- **apps/prism-analytics**: Python FastAPI analytics service. Port 8000.
- **packages/ui**: Shared Headless UI + Tailwind components (includes ChatAssistant, data-table, cards, buttons).
- **packages/db**: Shared Database Clients (Cosmos & Firestore).
- **packages/typescript-config**, **packages/eslint-config**: Shared configs.
*Rule: Strict boundaries (No Cross-App Imports). UI is "Shared First" in packages/ui.*

Each app that has an AI assistant (/api/assistant) has its own knowledge base tailored to its domain. The system-wide assistant (this one) covers the entire monorepo ecosystem and architecture.

## 3. Tech Stack ("Bleeding Edge")
- **Framework**: Next.js 16 (App Router) + React 19. (useOptimistic, useTransition, Server Actions natively).
- **State/Caching**: Upstash (Redis) for Rate Limiting. Zustand for global client state.
- **Storage**: Cloudflare R2 (S3 Compatible).
- **AI**: Vercel AI SDK (ai), Gemini 2.5 Flash, Azure OpenAI (GPT-4o), Azure AI Search / ChromaDB.
- **Frontend**: Tailwind CSS v4, @studio-freight/lenis (Scroll), framer-motion, gsap.

## 4. Visual Constitution (Design System)
- **Vibe**: Precision Engineering, Stealth Luxury, "Operating System" feel.
- **The "Void" Law**: The universe is #050505. There is no light mode.
- **Gradients**: Holographic Gradients (primary-cyan #06b6d4, primary-purple #8b5cf6).
- **Typography**: Inter (Variable) for Headings, JetBrains Mono for Technical Data.
- **Components**: "Ghost Glow" Buttons, "Glass Panel" Cards. Never pure black, use white/0.02 surface.

## 5. Security & Principles
- **Doppler Law**: Secrets are injected via Doppler (doppler run -- turbo dev), no manual .env files.
- **Zod Gate**: Every Server Action MUST validate inputs using Zod.
- **Server/Client Boundaries**: Firestore Timestamps MUST be serialized before passing to Client Components.
- **Alpha Filter**: Priority is "Sovereign" tech that empowers users to own their code and fixes "Context Entropy".
`;

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    const firstIP = forwarded.split(",")[0];
    return firstIP ? firstIP.trim() : "unknown";
  }
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting via Upstash
    const clientIP = getClientIP(request);
    const rlResult = await checkRateLimit(clientIP, "assistant");

    if (!rlResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment before trying again." },
        { status: 429, headers: getRateLimitHeaders(rlResult) },
      );
    }

    const body = await request.json();
    const { messages, message, history } = body;

    // Support both formats: { messages: [...] } or { message: string, history: [...] }
    let allMessages: Array<{ role: string; content: string }>;

    if (messages && Array.isArray(messages) && messages.length > 0) {
      allMessages = messages;
    } else if (message) {
      // Convert legacy format to messages array
      allMessages = [...(history || []), { role: "user", content: message }];
    } else {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 },
      );
    }

    const lastMessage = allMessages[allMessages.length - 1];
    if (!lastMessage || lastMessage.role !== "user" || !lastMessage.content) {
      return NextResponse.json(
        { error: "Invalid message format" },
        { status: 400 },
      );
    }

    const userQuestion = lastMessage.content;

    // Check cache for common questions
    const cacheKey = `assistant:labs:${userQuestion.toLowerCase().trim()}`;
    const cachedResponse = await getCachedResponse(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(
        { response: cachedResponse, cached: true },
        { headers: { ...getRateLimitHeaders(rlResult), "X-Cache": "HIT" } },
      );
    }

    // Check for API key
    const apiKey =
      process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service not configured. Please contact support." },
        { status: 503 },
      );
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build conversation history for context
    const conversationHistory = allMessages
      .slice(0, -1) // Exclude the last message (we'll add it separately)
      .map(
        (m: { role: string; content: string }) =>
          `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`,
      )
      .join("\n\n");

    // Create the prompt with System Wide context
    const systemPrompt = `${SYSTEM_WIDE_CONTEXT}

## Your Guidelines:
1. You are the definitive guide for the Syntaxure Labs monorepo. Answer questions about its architecture, components, Tech Stack, or rules.
2. If asked about unrelated topics, politely redirect back to Syntaxure Labs/Prism ecosystem.
3. Be concise but thorough - aim for helpful, actionable answers. Provide code snippets if applicable using the design system rules.
4. Use markdown formatting for code blocks, lists, and emphasis.
5. When referencing code, use proper syntax highlighting.
6. Be friendly, authoritative, and professional in tone (like a Lead Architect).
7. If you're unsure about a specific internal detail not covered in the context, say so rather than making up information.

${conversationHistory ? `## Previous Conversation:\n${conversationHistory}\n` : ""}

## User Question:
${userQuestion}

Provide a helpful, accurate response based on the system context above.`;

    // Generate response (non-streaming)
    const result = await model.generateContent(systemPrompt);
    const response = result.response.text();

    // Cache the response
    await cacheResponse(cacheKey, response, 300);

    return NextResponse.json(
      { response, cached: false },
      { headers: { ...getRateLimitHeaders(rlResult), "X-Cache": "MISS" } },
    );
  } catch (error) {
    console.error("System Assistant error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("API key")) {
      return NextResponse.json(
        { error: "AI service authentication failed. Please check configuration." },
        { status: 503 },
      );
    }

    if (errorMessage.includes("quota") || errorMessage.includes("rate")) {
      return NextResponse.json(
        { error: "AI service is temporarily unavailable. Please try again later." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "An error occurred while processing your request. Please try again." },
      { status: 500 },
    );
  }
}
