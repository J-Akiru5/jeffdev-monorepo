import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  checkRateLimit,
  getRateLimitHeaders,
  getCachedResponse,
  cacheResponse,
} from "@syntaxure/redis";

export const runtime = "edge";

// Client-facing knowledge base — no internal architecture or dev info
const SYSTEM_WIDE_CONTEXT = `
# Syntaxure Labs - Company & Services
You are the Syntaxure Labs AI Assistant. Your role is to help potential clients understand what Syntaxure Labs offers and guide them toward starting a project.

## About Syntaxure Labs
Syntaxure Labs is a custom software development agency. We build high-performance websites, SaaS platforms, cloud infrastructure, and AI integrations for businesses. We are based in Iloilo City, Philippines and operate globally.

## Services
1. **Web Development**: Custom high-performance marketing websites and web applications built with modern frameworks. Designed to load fast, rank well on search engines, and convert visitors.
2. **SaaS Platform Development**: Multi-tenant SaaS architectures with user accounts, subscription billing, and role-based access control. We build the foundation so you can launch and iterate.
3. **Cloud Infrastructure**: Cloud architecture design, deployment, and monitoring. We set up hosting that is secure, scalable, and cost-efficient.
4. **AI Integration**: Custom AI solutions including chatbots, document processing, intelligent search, and workflow automation. We also offer Context Engine for AI governance.

## Flagship Product: Context Engine
Context Engine is a proprietary AI Governance layer that enforces strict protocols and prevents AI hallucinations in enterprise environments. It ensures AI agents follow established rules and produce reliable, safe outputs.

## Pricing
We use custom pricing based on your project scope and requirements. Every project starts with a free consultation where we discuss your goals, then provide a fixed-price investment estimate. There are no hidden fees or hourly surprises.

## Process
1. **Discovery Call**: Free consultation to understand your project goals and requirements.
2. **Project Scope**: We define the deliverables, timeline, and fixed investment.
3. **Build**: Our team builds your solution using modern, scalable architecture.
4. **Launch & Support**: We deploy, test, and provide ongoing support.

## Team
- **Jeff Edrick Martinez** - CEO & Founder
- **Lou Vincent Baroro** - CTO & Co-Founder

## Contact
- Email: contact@syntaxure.dev
- Phone: +63 970 576 2593
- Location: Iloilo City, Philippines
`;

/**
 * Guard rail: Check if the question is relevant to this chatbot's purpose.
 * Only questions about services, pricing, process, company, or general inquiries are allowed.
 */
const ALLOWED_TOPICS = [
  "service", "website", "web", "saas", "platform", "cloud", "ai", "ai integration",
  "context engine", "pricing", "price", "cost", "budget", "quote", "investment",
  "process", "timeline", "how long", "how it works",
  "contact", "email", "phone", "location", "iloilo", "philippines",
  "team", "founder", "jeff", "lou", "about", "company",
  "start", "start project", "free consultation", "discovery call",
  "portfolio", "work", "case study", "project",
  "hello", "hi", "hey", "good morning", "good afternoon", "good evening",
  "help", "question", "support",
];

const BLOCKED_KEYWORDS = [
  // Direct probing for secrets or internal source
  "source code", "monorepo", "turborepo",
  "password", "secret", "api key", "token", "credential",
  // Malicious intent
  "hack", "exploit", "vulnerability", "security flaw",
  // Internal dev tooling (clients would never know these)
  "doppler", ".env", "zod", "upstash",
];

function isQuestionRelevant(question: string): { relevant: boolean; reason?: string } {
  const lower = question.toLowerCase().trim();

  // Check for blocked keywords first
  for (const keyword of BLOCKED_KEYWORDS) {
    if (lower.includes(keyword)) {
      return {
        relevant: false,
        reason: `I can only answer questions about Syntaxure Labs services, pricing, and process. Could you ask about something related to how we can help with your project?`,
      };
    }
  }

  // Short messages like "hi" or "hello" should always pass
  if (lower.length < 10) {
    return { relevant: true };
  }

  // Check if the question contains at least one allowed topic
  const hasAllowedTopic = ALLOWED_TOPICS.some((topic) => lower.includes(topic));

  if (!hasAllowedTopic) {
    return {
      relevant: false,
      reason: `I'm here to help with questions about Syntaxure Labs services, pricing, and how we can help with your project. Could you ask something related to that?`,
    };
  }

  return { relevant: true };
}

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

    // Guard rail: Check question relevance before sending to AI
    const guardCheck = isQuestionRelevant(userQuestion);
    if (!guardCheck.relevant) {
      return NextResponse.json(
        { response: guardCheck.reason, blocked: true },
        { headers: { ...getRateLimitHeaders(rlResult) } },
      );
    }

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
1. You are a helpful assistant for potential clients visiting the Syntaxure Labs website. Answer questions about services, pricing, process, and company information.
2. If asked about technical internal details (code, architecture, infrastructure), politely explain that those details are internal and redirect to discussing how we can help with their project.
3. If asked about pricing, explain that it is custom based on project scope and invite them to start a free consultation or request a quote.
4. Be friendly, professional, and clear - avoid buzzwords and technical jargon. Write for a business owner or decision maker.
5. If you're unsure about something not covered in the context, say so rather than making up information.

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
