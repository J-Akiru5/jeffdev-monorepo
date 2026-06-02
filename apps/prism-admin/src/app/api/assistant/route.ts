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

const ADMIN_CONTEXT = `
# Prism Admin — Knowledge Base

You are the Prism Admin assistant, built into the admin panel for Syntaxure Labs products. Help administrators manage users, subscriptions, analytics, agency services, and platform configurations.

## What is Prism Admin?
Prism Admin is the unified admin panel ("Mission Control") for Syntaxure Labs products. It provides tools for user management, subscription oversight, analytics dashboards, agency service management, contract management, and platform configuration.

## Key Features & Pages

### Dashboard (/admin/dashboard)
- Overview of platform metrics: total users, active subscriptions, revenue, growth
- Quick stats cards with trend indicators
- Recent activity feed

### Users (/admin/users)
- User table with search, filter, and pagination
- View user profiles, subscription tier, signup date, last active
- Impersonate or manage user accounts
- Export user data

### Subscriptions (/admin/subscriptions)
- Subscription management with status filters (Active, Cancelled, Past Due)
- PayPal subscription integration
- Manual override capabilities
- Revenue tracking and MRR calculations

### Analytics (/admin/analytics)
- Usage metrics across all Syntaxure Labs products
- User growth charts
- Feature adoption tracking
- Exportable reports

### Agency Services (/admin/agency/services)
- Manage service offerings (productized consulting packages)
- Create/edit service bundles with pricing
- Enable/disable services
- Track service delivery

### Contracts (/admin/agency/contracts)
- Client contract management
- Contract templates and versions
- Signing status tracking

### Quotes (/admin/quotes)
- Client quotation system
- Generate and send quotes
- Track quote status (Draft, Sent, Accepted, Rejected)

### Projects (/admin/projects)
- Project oversight across the agency
- Project status tracking
- Resource allocation

### Workspaces (/admin/workspaces)
- Workspace management and configuration
- Member management
- RBAC settings

### Releases (/admin/releases)
- Release management and changelogs
- Version tracking
- Feature flag management

### Billing (/admin/billing)
- Invoice management
- Payment history
- Billing configuration

## System Architecture
- **App URL**: admin.syntaxure.dev (port 3004 local)
- **Stack**: Next.js 16 + Supabase
- **Auth**: Supabase Auth (admin users only)
- **Database**: Supabase (PostgreSQL) for all admin data
- **UI**: Shared components from @syntaxure/ui
- **Theme**: Dark mode only, "void" aesthetic (#050505 background)

## Admin Roles & Access
- **Super Admin**: Full access to all sections
- **Admin**: Access to users, subscriptions, analytics, and agency tools
- **Viewer**: Read-only access to dashboards and reports
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
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `${ADMIN_CONTEXT}

## Your Guidelines:
1. You are the definitive guide for Prism Admin. Help admins manage users, subscriptions, analytics, and configurations.
2. If asked about unrelated topics, politely redirect back to admin-related topics.
3. Be concise but thorough — provide actionable steps.
4. Use markdown formatting for lists and emphasis.
5. Be professional and helpful (like a Senior System Administrator).
6. If you're unsure about a specific internal detail, say so rather than making up information.`,
    });

    const chatHistory = allMessages
      .slice(0, -1)
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(userQuestion);
    const response = result.response.text();
    setCachedResponse(userQuestion, response);

    return NextResponse.json({ response, cached: false }, {
      headers: { "X-RateLimit-Remaining": String(remaining), "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("Admin assistant error:", error);
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
