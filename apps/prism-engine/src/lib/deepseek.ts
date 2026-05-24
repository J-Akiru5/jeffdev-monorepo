import OpenAI from "openai";

let _deepseekClient: OpenAI | null = null;

function getDeepSeekClient(): OpenAI {
  if (_deepseekClient) return _deepseekClient;

  const endpoint = process.env.DEEPSEEK_ENDPOINT;
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!endpoint || !apiKey) {
    throw new Error(
      "DeepSeek not configured. Set DEEPSEEK_ENDPOINT and DEEPSEEK_API_KEY environment variables.",
    );
  }

  _deepseekClient = new OpenAI({
    apiKey,
    baseURL: endpoint,
  });

  return _deepseekClient;
}

export interface ExtractedRule {
  title: string;
  description: string;
  category: "architecture" | "code-style" | "naming" | "testing" | "performance" | "security" | "documentation" | "general";
  tags: string[];
  priority: number;
  examples?: { good?: string; bad?: string };
}

export interface RuleExtractionResult {
  rules: ExtractedRule[];
  summary: string;
  confidence: "high" | "medium" | "low";
  processingTime: number;
}

const MODEL = process.env.DEEPSEEK_MODEL_NAME || "DeepSeek-V4-Flash";

export async function extractRulesFromTranscript(
  transcript: string,
  videoTitle: string,
  projectId?: string,
): Promise<RuleExtractionResult> {
  const startTime = Date.now();
  const client = getDeepSeekClient();

  const systemPrompt = `You are an expert software architect analyzing video content to extract coding standards, architectural patterns, and development best practices.

Your task is to analyze the transcript and identify:
- Architectural patterns and decisions
- Code style conventions
- Naming conventions
- Testing strategies
- Performance considerations
- Security practices
- Documentation standards
- General development principles

For each rule you extract, provide:
1. A clear, actionable title
2. Detailed description explaining WHY this matters
3. Appropriate category
4. Relevant tags for searchability
5. Priority (1=critical, 5=important, 10=nice-to-have)
6. Code examples where applicable

Be specific and actionable. Avoid generic advice like "write clean code" - extract concrete, implementable rules.`;

  const userPrompt = `Video Title: ${videoTitle}
${projectId ? `Project ID: ${projectId}\n` : ""}
Transcript:
---
${transcript}
---

Extract all architectural rules, patterns, and coding conventions mentioned in this video. Return ONLY valid JSON matching this exact structure:

{
  "rules": [
    {
      "title": "Rule name (concise, 3-7 words)",
      "description": "Detailed explanation of the rule and its rationale",
      "category": "architecture|code-style|naming|testing|performance|security|documentation|general",
      "tags": ["tag1", "tag2", "tag3"],
      "priority": 1-10,
      "examples": {
        "good": "// Example of correct implementation",
        "bad": "// Example of what to avoid"
      }
    }
  ],
  "summary": "Brief overview of the main architectural themes discussed",
  "confidence": "high|medium|low"
}

If the video doesn't contain technical content suitable for rule extraction, return an empty rules array with confidence "low".`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("DeepSeek returned empty response");
    }

    const parsed = JSON.parse(content) as {
      rules: ExtractedRule[];
      summary: string;
      confidence: "high" | "medium" | "low";
    };

    return {
      ...parsed,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error("[DeepSeek] Rule extraction failed:", error);
    throw new Error(
      `Failed to extract rules from transcript: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function generateChatCompletion(params: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json_object" | "text";
}): Promise<string> {
  const client = getDeepSeekClient();

  const completionParams: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
    model: MODEL,
    messages: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: params.userPrompt },
    ],
    temperature: params.temperature ?? 0.3,
    max_tokens: params.maxTokens ?? 4000,
  };

  if (params.responseFormat === "json_object") {
    completionParams.response_format = { type: "json_object" };
  }

  try {
    const response = await client.chat.completions.create(completionParams);
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("DeepSeek returned empty response");
    }
    return content;
  } catch (error) {
    console.error("[DeepSeek] Chat completion failed:", error);
    throw new Error(
      `DeepSeek chat completion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
