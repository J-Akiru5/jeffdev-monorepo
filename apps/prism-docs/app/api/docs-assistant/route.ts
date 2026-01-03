import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Rate limiting store (in-memory for simplicity, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Response cache (in-memory, use Redis in production)
const responseCache = new Map<string, { response: string; timestamp: number }>();

const RATE_LIMIT_MAX = 20; // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Documentation context for RAG
const DOCS_CONTEXT = `
# Prism Context Engine Documentation

## What is Prism Context Engine?
Prism Context Engine is an enterprise-grade AI Context Management platform that helps development teams govern, organize, and deploy contextual rules to AI coding assistants. Think of it as a sophisticated kitchen management system for AI: raw knowledge and guidelines (ingredients) are transformed into structured, actionable rules (recipes) that AI assistants can consistently follow.

## Core Concepts

### Context Governance
Context Governance is the practice of managing what contextual information and rules AI assistants receive. Without proper governance, AI assistants may:
- Generate inconsistent code styles across team members
- Miss important architectural patterns or security requirements
- Lack awareness of project-specific conventions
- Produce code that doesn't match your brand or design system

### The Kitchen Metaphor
Prism uses a kitchen metaphor to explain how it works:
- **Ingredients** = Raw knowledge (videos, documents, brand guidelines)
- **Recipes** = Structured rules extracted from ingredients
- **Kitchen** = The Prism workspace where transformation happens
- **Chefs** = AI assistants that follow your recipes

### MCP Protocol
The Model Context Protocol (MCP) is an open standard for connecting AI assistants to external context sources. Prism implements MCP servers that expose your rules to compatible AI assistants.

## Key Features

### Video Rule Extraction
Upload tutorial videos, conference talks, or training content. Prism uses Azure OpenAI with GPT-4o-mini to:
1. Transcribe video content
2. Extract actionable coding rules
3. Structure them in markdown format

### Rule Templates
Pre-built templates for common use cases:
- React/Next.js best practices
- TypeScript conventions
- React Native development
- API design patterns

### Brand Profiles
Store company-specific information:
- Design system colors and typography
- Voice and tone guidelines
- Code style preferences
- Architecture patterns

### Semantic Search
Find relevant rules using natural language queries. Powered by embeddings that understand the meaning behind your search terms.

## Integrations

### Cursor IDE
1. Open Cursor Settings (Cmd/Ctrl + ,)
2. Navigate to Features → MCP
3. Add server with transport "stdio" and command path to your MCP server

### Windsurf
1. Open Windsurf Settings
2. Go to AI → Context Providers
3. Add MCP server configuration

### VS Code
1. Install the MCP extension
2. Configure the server in settings.json
3. Use the command palette to connect

### Claude Desktop
1. Edit ~/Library/Application Support/Claude/claude_desktop_config.json (Mac)
2. Add MCP server under "mcpServers" configuration

## Installation

### Using npm
\`\`\`bash
npx prism-context-engine init
\`\`\`

### Using the CLI
\`\`\`bash
npm install -g @prism/cli
prism init
prism rules list
prism rules export --format=markdown
\`\`\`

## Common Issues

### MCP Connection Issues
- Verify the server is running: check terminal for startup messages
- Ensure correct path to server executable
- Check firewall settings for local connections

### API Key Problems
- Verify AZURE_OPENAI_API_KEY is set correctly
- Check the endpoint URL matches your Azure resource
- Ensure deployment name is correct (default: gpt-4o-mini)

### Rate Limiting
- Video processing is limited to prevent API abuse
- Wait 60 seconds between large processing jobs
- Consider upgrading to higher tier for increased limits

## Security

Prism follows enterprise security best practices:
- All data encrypted in transit (TLS 1.3)
- API keys stored securely using environment variables
- No sensitive data logged or cached
- SOC 2 compliance in progress

## Pricing

- **Free Tier**: 3 videos/month, basic rules, community support
- **Pro Tier**: Unlimited videos, advanced features, priority support
- **Enterprise**: Custom deployment, SSO, dedicated support

## Getting Help

- Documentation: https://docs.prism.dev
- Discord Community: https://discord.gg/prism
- Email: support@prism.dev
`;

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    const firstIP = forwarded.split(',')[0];
    return firstIP ? firstIP.trim() : 'unknown';
  }
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

function getCachedResponse(question: string): string | null {
  const cacheKey = question.toLowerCase().trim();
  const cached = responseCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.response;
  }
  
  if (cached) {
    responseCache.delete(cacheKey);
  }
  
  return null;
}

function setCachedResponse(question: string, response: string): void {
  const cacheKey = question.toLowerCase().trim();
  responseCache.set(cacheKey, { response, timestamp: Date.now() });
  
  // Clean old entries if cache is too large
  if (responseCache.size > 1000) {
    const entries = Array.from(responseCache.entries());
    const now = Date.now();
    entries.forEach(([key, value]) => {
      if (now - value.timestamp > CACHE_TTL) {
        responseCache.delete(key);
      }
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const { allowed, remaining } = checkRateLimit(clientIP);
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment before trying again.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(RATE_LIMIT_WINDOW / 1000))
          }
        }
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
      allMessages = [
        ...(history || []),
        { role: 'user', content: message }
      ];
    } else {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    const lastMessage = allMessages[allMessages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user' || !lastMessage.content) {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      );
    }

    const userQuestion = lastMessage.content;

    // Check cache for common questions
    const cachedResponse = getCachedResponse(userQuestion);
    if (cachedResponse) {
      return NextResponse.json({
        response: cachedResponse,
        cached: true
      }, {
        headers: {
          'X-RateLimit-Remaining': String(remaining),
          'X-Cache': 'HIT'
        }
      });
    }

    // Check for API key
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured. Please contact support.' },
        { status: 503 }
      );
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build conversation history for context
    const conversationHistory = allMessages
      .slice(0, -1) // Exclude the last message (we'll add it separately)
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    // Create the prompt with RAG context
    const systemPrompt = `You are the Prism Context Engine documentation assistant. Your role is to help users understand and use Prism Context Engine effectively.

## Your Guidelines:
1. ONLY answer questions about Prism Context Engine, its features, installation, integrations, and related topics
2. If asked about unrelated topics, politely redirect to Prism-related questions
3. Be concise but thorough - aim for helpful, actionable answers
4. Use markdown formatting for code blocks, lists, and emphasis
5. When referencing code, use proper syntax highlighting
6. Be friendly and professional in tone
7. If you're unsure about something, say so rather than making up information

## Documentation Context:
${DOCS_CONTEXT}

${conversationHistory ? `## Previous Conversation:\n${conversationHistory}\n` : ''}

## User Question:
${userQuestion}

Provide a helpful, accurate response based on the documentation context above. If the question is not about Prism Context Engine, politely explain that you can only help with Prism-related questions.`;

    // Generate response (non-streaming)
    const result = await model.generateContent(systemPrompt);
    const response = result.response.text();

    // Cache the response
    setCachedResponse(userQuestion, response);

    return NextResponse.json({
      response,
      cached: false
    }, {
      headers: {
        'X-RateLimit-Remaining': String(remaining),
        'X-Cache': 'MISS'
      }
    });

  } catch (error) {
    console.error('Docs assistant error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for specific error types
    if (errorMessage.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service authentication failed. Please check configuration.' },
        { status: 503 }
      );
    }
    
    if (errorMessage.includes('quota') || errorMessage.includes('rate')) {
      return NextResponse.json(
        { error: 'AI service is temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while processing your request. Please try again.' },
      { status: 500 }
    );
  }
}
