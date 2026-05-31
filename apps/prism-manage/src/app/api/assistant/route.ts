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

const MANAGE_CONTEXT = `
# Prism Manage — Knowledge Base

You are the Prism Manage assistant, built into the task management application. Help users manage their tasks, projects, calendars, and workspaces effectively.

## What is Prism Manage?
Prism Manage is a personal and team project management application with Google Calendar integration, Kanban boards, department-based workflow management, and keyboard-first navigation. It serves both personal task tracking and team collaboration for Syntaxure Labs.

## Key Features & Pages

### Dashboard (/dashboard)
- Executive overview with workspace stats (departments, members, tasks, completed)
- Department grid with member counts and descriptions
- Quick actions for founders (manage members, marketing, tasks)

### Tasks (/tasks)
- Full task list with status, priority, assignee, and project tags
- Starred tasks filter for quick access
- Task creation via inline form or dedicated page
- Task completion toggling with optimistic UI
- Department-based filtering for Syntaxure Labs workspace
- Virtualized task list for large datasets (using @tanstack/react-virtual)

### Calendar (/calendar)
- Integrated calendar view synced with Google Calendar
- Task due date visualization
- Drag-and-drop scheduling

### Kanban (/kanban)
- Drag-and-drop Kanban board with columns (To Do, In Progress, Review, Approved)
- Project-based filtering
- Optimized with React.memo for smooth drag performance
- Department scoping for team workspaces

### Marketing (/marketing)
- Marketing task board with CPO review workflow
- Marketing dashboard with analytics
- Task board with filtered views

### Settings (/settings)
- Account settings and profile management
- Workspace configuration
- Theme preferences (light/dark)
- Keyboard shortcuts reference
- Audit trail for workspace changes
- Team member management

## Core Concepts

### Workspaces
- **Personal**: Individual task management with custom lists
- **Syntaxure Labs**: Team workspace with departments (Engineering, Product, Marketing, Operations, Design)
- **RBAC**: Role-based access control — Founders see all, employees see their department

### Modes
- **Focus Mode**: Personal task management with quick filters and views
- **Workspace Mode**: Team collaboration with departments and RBAC

### Keyboard Shortcuts
- ⌘K / Ctrl+K: Command palette
- ⌘N: Quick add task
- ⌘⇧M: Toggle mode (Focus/Workspace)
- ⌘⇧/: Keyboard shortcuts help
- ⌘1-4: Quick navigation to views

## Tech Stack
- **App URL**: manage.syntaxure.dev (port 3007 local)
- **Stack**: Next.js 16 + Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **State**: Zustand for global state, React context for projects
- **UI**: Shared components from @syntaxure/ui
- **Virtualization**: @tanstack/react-virtual for large lists
- **Calendar**: Google Calendar API integration

## Architecture Rules
- Tasks are scoped to workspaces and optionally departments
- Real-time updates via Supabase subscriptions
- Optimistic updates for task mutations (toggle complete, star)
- Data is fetched server-side and hydrated into Zustand stores
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

    const systemPrompt = `${MANAGE_CONTEXT}

## Your Guidelines:
1. You are the definitive guide for Prism Manage. Help users manage tasks, projects, calendars, and navigate the app.
2. If asked about unrelated topics, politely redirect back to task/productivity management.
3. Be concise but thorough — provide actionable steps and keyboard shortcuts.
4. Use markdown formatting for lists, code blocks, and emphasis.
5. Be friendly and helpful (like a Productive Project Manager).
6. If you're unsure about a specific internal detail, say so rather than making up information.

${conversationHistory ? `## Previous Conversation:\n${conversationHistory}\n` : ""}

## User Question:
${userQuestion}

Provide a helpful, accurate response based on the manage app context above.`;

    const result = await model.generateContent(systemPrompt);
    const response = result.response.text();
    setCachedResponse(userQuestion, response);

    return NextResponse.json({ response, cached: false }, {
      headers: { "X-RateLimit-Remaining": String(remaining), "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("Manage assistant error:", error);
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
