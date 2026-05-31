import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "edge";

// Rate limiting store (in-memory)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Response cache
const responseCache = new Map<string, { response: string; timestamp: number }>();

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW = 60 * 1000;
const CACHE_TTL = 5 * 60 * 1000;

const PRISM_CONTEXT = `
# Prism Context Engine — Product Knowledge Base

You are the Prism Context Engine assistant, built into the Prism product application. Help users understand and use Prism Context Engine effectively.

## What is Prism Context Engine?
Prism Context Engine is an enterprise-grade AI Context Management platform that helps development teams govern, organize, and deploy contextual rules to AI coding assistants. It uses the "kitchen metaphor": raw knowledge (ingredients) → structured rules (recipes) → AI assistants (chefs).

## Core Concepts
- **Context Governance**: Managing what contextual info and rules AI assistants receive
- **MCP (Model Context Protocol)**: Open standard for connecting AI assistants to external context sources
- **Video Rule Extraction**: Upload tutorials → Azure AI transcribes → extracts actionable coding rules
- **Rule Templates**: Pre-built for React, Next.js, TypeScript, React Native, API design
- **Brand Profiles**: Store design systems, voice guidelines, code style preferences
- **Semantic Search**: Natural language rule discovery via embeddings

## Integrations
- **Cursor**: Settings → Features → MCP → Add stdio server
- **Windsurf**: Settings → AI → Context Providers → Add MCP
- **VS Code**: MCP extension → configure in settings.json
- **Claude Desktop**: Edit claude_desktop_config.json

## Tech Stack
- Next.js 16 (App Router) + React 19
- Azure Cosmos DB (NoSQL) for rule storage
- Azure OpenAI (GPT-4o-mini) for video transcription & rule extraction
- Gemini 2.5 Flash for chat assistant
- Vercel AI SDK

## App Pages & Features
- **Dashboard** (/dashboard): Executive overview, active rules, usage stats
- **AI Kitchen** (/generate): Generate UI components from descriptions
- **Projects** (/projects): Manage rule projects with version history
- **Skills** (/projects/[slug]/skills): Procedural guides for AI assistants
- **Quickstart** (/quickstart): Setup guide for new users
- **Onboarding** (/onboarding): First-run experience
- **Subscription** (/subscription): Plan management (Free, Pro, Enterprise)
- **Pricing** (/pricing): Plan comparison
- **MCP Studio** (/mcp-studio): MCP server management

## Architecture Rules
- UI is "Shared First" — components go in packages/ui
- Cross-app imports are forbidden (use @repo/* packages)
- Server actions return { success: boolean; error?: string }
- Firestore Timestamps must be serialized before passing to client components
- Zod validation on every server action
- Zustand for global client state
`;

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  if (forwarded) {
    const firstIP = forwarded.split(",")[0];
    return firstIP ? firstIP.trim() : "unknown";
  }
  if (realIP) return realIP;
  return "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  if (record.count >= RATE_LIMIT_MAX) return { allowed: false, remaining: 0 };
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

function getCachedResponse(question: string): string | null {
  const cacheKey = question.toLowerCase().trim();
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.response;
  if (cached) responseCache.delete(cacheKey);
  return null;
}

function setCachedResponse(question: string, response: string): void {
  const cacheKey = question.toLowerCase().trim();
  responseCache.set(cacheKey, { response, timestamp: Date.now() });
  if (responseCache.size > 1000) {
    const entries = Array.from(responseCache.entries());
    const now = Date.now();
    entries.forEach(([key, value]) => {
      if (now - value.timestamp > CACHE_TTL) responseCache.delete(key);
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const { allowed, remaining } = checkRateLimit(clientIP);
    if (!allowed) {
      return NextResponse.json({ error: "Rate limit exceeded. Please wait a moment before trying again." }, { status: 429 });
    }

    const body = await request.json();
    const { messages, message, history } = body;

    let allMessages: Array<{ role: string; content: string }>;
    if (messages && Array.isArray(messages) && messages.length > 0) {
      allMessages = messages;
    } else if (message) {
      allMessages = [...(history || []), { role: "user", content: message }];
    } else {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    const lastMessage = allMessages[allMessages.length - 1];
    if (!lastMessage || lastMessage.role !== "user" || !lastMessage.content) {
      return NextResponse.json({ error: "Invalid message format" }, { status: 400 });
    }

    const userQuestion = lastMessage.content;
    const cachedResponse = getCachedResponse(userQuestion);
    if (cachedResponse) {
      return NextResponse.json({ response: cachedResponse, cached: true }, {
        headers: { "X-RateLimit-Remaining": String(remaining), "X-Cache": "HIT" },
      });
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI service not configured. Please contact support." }, { status: 503 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const conversationHistory = allMessages
      .slice(0, -1)
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    const systemPrompt = `${PRISM_CONTEXT}

## Your Guidelines:
1. You are the definitive guide for Prism Context Engine. Answer questions about its features, installation, integrations, pricing, and usage.
2. If asked about unrelated topics, politely redirect back to Prism-related questions.
3. Be concise but thorough — provide code snippets and CLI commands where applicable.
4. Use markdown formatting for code blocks, lists, and emphasis.
5. When referencing code, use proper syntax highlighting.
6. Be friendly, professional, and authoritative (like a Product Architect).
7. If you're unsure about an internal detail not covered in the context, say so rather than making up information.

${conversationHistory ? `## Previous Conversation:\n${conversationHistory}\n` : ""}

## User Question:
${userQuestion}

Provide a helpful, accurate response based on the product context above.`;

    const result = await model.generateContent(systemPrompt);
    const response = result.response.text();
    setCachedResponse(userQuestion, response);

    return NextResponse.json({ response, cached: false }, {
      headers: { "X-RateLimit-Remaining": String(remaining), "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("Prism Engine assistant error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    if (errorMessage.includes("API key")) {
      return NextResponse.json({ error: "AI service authentication failed. Please check configuration." }, { status: 503 });
    }
    if (errorMessage.includes("quota") || errorMessage.includes("rate")) {
      return NextResponse.json({ error: "AI service is temporarily unavailable. Please try again later." }, { status: 503 });
    }
    return NextResponse.json({ error: "An error occurred while processing your request. Please try again." }, { status: 500 });
  }
}
