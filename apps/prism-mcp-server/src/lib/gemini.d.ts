export declare function generateEmbedding(
  text: string,
  model?: string,
): Promise<number[]>;
export declare function batchGenerateEmbeddings(
  texts: string[],
  model?: string,
): Promise<number[][]>;
export declare function generateChat(
  systemPrompt: string,
  userMessage: string,
  model?: string,
): Promise<string>;
//# sourceMappingURL=gemini.d.ts.map
