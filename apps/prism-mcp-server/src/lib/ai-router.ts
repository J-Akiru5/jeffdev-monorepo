import { generateEmbedding as geminiEmbed, batchGenerateEmbeddings as geminiBatchEmbed, generateChat as geminiChat } from "./gemini.js";
import { generateQueryEmbedding as azureEmbed, generateBatchEmbeddings as azureBatchEmbed, generateChatCompletion as azureChat } from "./azure-openai.js";

export const AI_PROVIDER = (process.env.AI_PROVIDER || "gemini").toLowerCase();

function isGemini(): boolean {
  return AI_PROVIDER === "gemini";
}

export async function getEmbedding(text: string): Promise<number[]> {
  if (isGemini()) return geminiEmbed(text);
  return azureEmbed(text);
}

export async function getBatchEmbeddings(texts: string[]): Promise<number[][]> {
  if (isGemini()) return geminiBatchEmbed(texts);
  return azureBatchEmbed(texts);
}

export async function generateContent(
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  if (isGemini()) return geminiChat(systemPrompt, userMessage);
  return azureChat(systemPrompt, userMessage);
}
