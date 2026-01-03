/**
 * Azure OpenAI Client
 * 
 * Processes video transcripts to extract architectural rules, patterns, and conventions.
 * Uses GPT-4o-mini for cost-effective rule extraction.
 */

import { AzureOpenAI } from 'openai';

let _azureClient: AzureOpenAI | null = null;

function getAzureOpenAIClient(): AzureOpenAI {
  if (_azureClient) return _azureClient;

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o-mini';

  if (!endpoint || !apiKey) {
    throw new Error(
      'Azure OpenAI not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY environment variables.'
    );
  }

  _azureClient = new AzureOpenAI({
    endpoint,
    apiKey,
    deployment,
    apiVersion: '2024-10-01-preview',
  });

  return _azureClient;
}

export interface ExtractedRule {
  title: string;
  description: string;
  category: 'architecture' | 'code-style' | 'naming' | 'testing' | 'performance' | 'security' | 'documentation' | 'general';
  tags: string[];
  priority: number; // 1 = highest, 10 = lowest
  examples?: {
    good?: string;
    bad?: string;
  };
}

export interface RuleExtractionResult {
  rules: ExtractedRule[];
  summary: string;
  confidence: 'high' | 'medium' | 'low';
  processingTime: number;
}

/**
 * Extract architectural rules from video transcript using GPT-4o-mini
 */
export async function extractRulesFromTranscript(
  transcript: string,
  videoTitle: string,
  projectId?: string
): Promise<RuleExtractionResult> {
  const startTime = Date.now();

  const client = getAzureOpenAIClient();

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
${projectId ? `Project ID: ${projectId}\n` : ''}
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
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent, factual extraction
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Azure OpenAI returned empty response');
    }

    const parsed = JSON.parse(content) as {
      rules: ExtractedRule[];
      summary: string;
      confidence: 'high' | 'medium' | 'low';
    };

    const processingTime = Date.now() - startTime;

    return {
      ...parsed,
      processingTime,
    };
  } catch (error) {
    console.error('[Azure OpenAI] Rule extraction failed:', error);
    throw new Error(
      `Failed to extract rules from transcript: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate embeddings for semantic search (Phase 3)
 * Uses text-embedding-3-small model (1536 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getAzureOpenAIClient();

  try {
    const response = await client.embeddings.create({
      model: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-small',
      input: text.substring(0, 8000), // Limit to ~8000 chars to stay under token limits
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('[Azure OpenAI] Embedding generation failed:', error);
    throw new Error(
      `Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
