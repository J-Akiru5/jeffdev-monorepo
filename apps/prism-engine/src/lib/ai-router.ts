import type { ExtractedRule, RuleExtractionResult } from "./deepseek";

export type AIProvider = "opencode" | "deepseek" | "gemini" | "azure";

/**
 * Phase 3: OpenCode Zen is the primary provider when configured (free
 * models first, MIMO default — see lib/opencode.ts). An explicit
 * AI_PROVIDER env still wins so existing deployments are untouched.
 */
export function getAIProvider(): AIProvider {
  const explicit = process.env.AI_PROVIDER;
  if (explicit) return explicit.toLowerCase() as AIProvider;
  if (process.env.OPENCODE_API_KEY) return "opencode";
  return "deepseek";
}

export async function generateChatCompletion(params: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json_object" | "text";
  /** Phase 3 multi-model selection: honoured by the opencode provider. */
  model?: string;
}): Promise<string> {
  const provider = getAIProvider();

  switch (provider) {
    case "opencode": {
      const { opencodeChat } = await import("./opencode");
      return opencodeChat({
        systemPrompt: params.systemPrompt,
        userPrompt: params.userPrompt,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        json: params.responseFormat === "json_object",
        model: params.model,
      });
    }
    case "deepseek": {
      const { generateChatCompletion } = await import("./deepseek");
      return generateChatCompletion(params);
    }
    case "azure": {
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const apiKey = process.env.AZURE_OPENAI_API_KEY;
      const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o-mini";
      const { AzureOpenAI } = await import("openai");
      const client = new AzureOpenAI({ endpoint, apiKey, apiVersion: "2024-10-01-preview" });
      const response = await client.chat.completions.create({
        model: deployment,
        messages: [
          { role: "system", content: params.systemPrompt },
          { role: "user", content: params.userPrompt },
        ],
        temperature: params.temperature ?? 0.3,
        max_tokens: params.maxTokens ?? 4000,
        ...(params.responseFormat === "json_object" ? { response_format: { type: "json_object" as const } } : {}),
      });
      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("Azure OpenAI returned empty response");
      return content;
    }
    case "gemini": {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });
      const result = await model.generateContent(`${params.systemPrompt}\n\n${params.userPrompt}`);
      const text = result.response.text();
      if (!text) throw new Error("Gemini returned empty response");
      return text;
    }
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

export async function extractRulesFromTranscript(
  transcript: string,
  videoTitle: string,
  projectId?: string,
): Promise<RuleExtractionResult> {
  const startTime = Date.now();
  const provider = getAIProvider();

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
    const raw = await generateChatCompletion({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: 4000,
      responseFormat: "json_object",
    });

    const parsed = JSON.parse(raw) as {
      rules: ExtractedRule[];
      summary: string;
      confidence: "high" | "medium" | "low";
    };

    return {
      ...parsed,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error(`[AI Router] Rule extraction failed (provider=${provider}):`, error);
    throw new Error(
      `Failed to extract rules: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export { generateComponent } from "./gemini";
export { enhanceRuleWithAI } from "./gemini";
export { generateRulesFromComponent } from "./gemini";
