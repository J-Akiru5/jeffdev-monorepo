export declare const AI_PROVIDER: string;
export declare function getEmbedding(text: string): Promise<number[]>;
export declare function getBatchEmbeddings(texts: string[]): Promise<number[][]>;
export declare function generateContent(systemPrompt: string, userMessage: string): Promise<string>;
//# sourceMappingURL=ai-router.d.ts.map