/**
 * Azure OpenAI Client for MCP Server
 *
 * Generates embeddings for semantic search queries and chat completions.
 */
import { AzureOpenAI } from 'openai';
function getBaseEndpoint(raw) {
    try {
        const url = new URL(raw);
        if (url.pathname.includes('/deployments/')) {
            url.pathname = '/';
            url.search = '';
        }
        return url.toString().replace(/\/+$/, '');
    }
    catch {
        return raw.replace(/\/+$/, '');
    }
}
let _azureClient = null;
function getAzureOpenAIClient() {
    if (_azureClient)
        return _azureClient;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    if (!endpoint || !apiKey) {
        throw new Error('Azure OpenAI not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY environment variables.');
    }
    _azureClient = new AzureOpenAI({
        endpoint: getBaseEndpoint(endpoint),
        apiKey,
        apiVersion: '2024-10-01-preview',
    });
    return _azureClient;
}
/**
 * Generate embedding for search query
 */
export async function generateQueryEmbedding(query) {
    const client = getAzureOpenAIClient();
    try {
        const response = await client.embeddings.create({
            model: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-small',
            input: query,
        });
        return response.data[0]?.embedding || [];
    }
    catch (error) {
        console.error('[Azure OpenAI] Query embedding generation failed:', error);
        throw new Error(`Failed to generate query embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateBatchEmbeddings(texts) {
    const client = getAzureOpenAIClient();
    const model = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-small';
    const results = [];
    for (let i = 0; i < texts.length; i += 10) {
        const batch = texts.slice(i, i + 10);
        const response = await client.embeddings.create({ model, input: batch });
        for (const item of response.data) {
            results.push(item.embedding);
        }
    }
    return results;
}
/**
 * Generate chat completion
 */
export async function generateChatCompletion(systemPrompt, userMessage) {
    const client = getAzureOpenAIClient();
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o-mini';
    const response = await client.chat.completions.create({
        model: deployment,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
        ],
        max_tokens: 2000,
    });
    return response.choices[0]?.message?.content || '';
}
