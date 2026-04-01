import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Rate limiting store (in-memory for simplicity, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Response cache (in-memory, use Redis in production)
const responseCache = new Map<string, { response: string; timestamp: number }>();

const RATE_LIMIT_MAX = 20; // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// System Wide Knowledge Base Context
const SYSTEM_WIDE_CONTEXT = `
# Martinez Hybrid Technologies (MHT) OPC - System-Wide Context
You are the MHT Support Assistant, an AI built into the Martinez Hybrid Technologies website to help customers with common issues instantly.

## 1. Core Divisions
**Nexure Networks:**
- Role: Fast, reliable, and affordable internet services.
- Coverage: Western Visayas, Philippines (Headquartered in Dingle, Iloilo).
- Pre-launch Status: Currently in pre-launch phase. Collecting early registrations.

**Joularix Solar:**
- Role: Premium solar installations and renewable energy solutions.
- Services: Grid-tied, off-grid, and hybrid solar setups. Free routine maintenance.
- Pre-launch Status: Currently in pre-launch phase.

## 2. Capabilities & Topics You Handle
You are equipped to handle the following topics:
- **Account status & balance checks**: Guide users to check their emails or contact support since the portal is in pre-launch.
- **Basic troubleshooting guides**: e.g., restarting routers for internet, checking error codes for solar inverters.
- **Service availability inquiries**: Confirm focus on Dingle, Iloilo and the wider Western Visayas region.
- **Payment confirmation**: Instruct users how payments are confirmed (GCash, Maya, Bank Transfer).

## 3. Contact Information
- Main Phone: 0951-916-7103
- Alternative Phone: 0998-386-0315
- Office: Dingle, Iloilo, Philippines

## 4. Escapation Policy
- For complex issues, electrical safety concerns (Joularix), or urgent matters, instruct the user that "Complex issues are escalated to human agents during business hours (Mon-Sat 8AM-5PM)." or provide the main contact number.

## 5. Security & Principles
- **Tone**: Always be professional, helpful, and courteous. You represent Martinez Hybrid Technologies OPC.
- **Focus**: If asked about unrelated topics (like other companies, general chit-chat), politely redirect back to MHT services.
- **Pre-Launch**: Acknowledge that services are in the pre-launch phase when asked about immediate sign-ups.
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build conversation history for context
    const conversationHistory = allMessages
      .slice(0, -1) // Exclude the last message (we'll add it separately)
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    // Create the prompt with System Wide context
    const systemPrompt = `${SYSTEM_WIDE_CONTEXT}

## Your Guidelines:
1. You are the customer support AI for Martinez Hybrid Technologies OPC. Answer questions about its services (Nexure Networks, Joularix), support, billing, or general inquiries.
2. Be concise but thorough - aim for helpful, actionable answers.
3. Use markdown formatting for readability.
4. Be friendly, empathetic, and professional in tone.
5. If you cannot solve a problem, inform the user they can contact our human agents during business hours or call 0951-916-7103.

${conversationHistory ? `## Previous Conversation:\n${conversationHistory}\n` : ''}

## User Question:
${userQuestion}

Provide a helpful, accurate response based on the system context above.`;

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
    console.error('MHT Assistant error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
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
