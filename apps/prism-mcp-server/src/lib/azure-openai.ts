/**
 * Azure OpenAI Client for MCP Server
 * 
 * Generates embeddings for semantic search queries
 */

import { AzureOpenAI } from 'openai';

let _azureClient: AzureOpenAI | null = null;

function getAzureOpenAIClient(): AzureOpenAI {
  if (_azureClient) return _azureClient;

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;

  if (!endpoint || !apiKey) {
    throw new Error(
      'Azure OpenAI not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY environment variables.'
    );
  }

  _azureClient = new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion: '2024-10-01-preview',
  });

  return _azureClient;
}

/**
 * Generate embedding for search query
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const client = getAzureOpenAIClient();

  try {
    const response = await client.embeddings.create({
      model: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-small',
      input: query,
    });

    return response.data[0]?.embedding || [];
  } catch (error) {
    console.error('[Azure OpenAI] Query embedding generation failed:', error);
    throw new Error(
      `Failed to generate query embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
