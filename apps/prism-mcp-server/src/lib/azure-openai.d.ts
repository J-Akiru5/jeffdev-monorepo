/**
 * Azure OpenAI Client for MCP Server
 *
 * Generates embeddings for semantic search queries and chat completions.
 */
/**
 * Generate embedding for search query
 */
export declare function generateQueryEmbedding(query: string): Promise<number[]>;
/**
 * Generate embeddings for multiple texts in batch
 */
export declare function generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
/**
 * Generate chat completion
 */
export declare function generateChatCompletion(systemPrompt: string, userMessage: string): Promise<string>;
//# sourceMappingURL=azure-openai.d.ts.map