import { extractRulesFromTranscript as routerExtract } from "./ai-router";

export type { ExtractedRule, RuleExtractionResult } from "./deepseek";

export async function extractRulesFromTranscript(
  transcript: string,
  videoTitle: string,
  projectId?: string,
): Promise<import("./deepseek").RuleExtractionResult> {
  return routerExtract(transcript, videoTitle, projectId);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const provider = (process.env.AI_PROVIDER || "deepseek").toLowerCase();
  if (provider === "azure") {
    const { AzureOpenAI } = await import("openai");
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    if (!endpoint || !apiKey) {
      throw new Error("Azure OpenAI not configured for embeddings");
    }
    const client = new AzureOpenAI({
      endpoint,
      apiKey,
      apiVersion: "2024-10-01-preview",
    });
    const response = await client.embeddings.create({
      model: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || "text-embedding-3-small",
      input: text.substring(0, 8000),
    });
    return response.data[0]!.embedding;
  }
  throw new Error(`Embeddings not supported by provider: ${provider}. Use AI_PROVIDER=azure for embeddings.`);
}
