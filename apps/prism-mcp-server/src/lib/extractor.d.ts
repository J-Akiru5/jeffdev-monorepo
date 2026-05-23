export interface ExtractedDesignTokens {
    url: string;
    pagesScanned: number;
    tokensUsed: number;
    cssVariables: Record<string, string>;
    colors: string[];
    typography: {
        fontFamily: string;
        fontSizes: string[];
        headings: Record<string, {
            fontSize: string;
            fontWeight: string;
            fontFamily: string;
        }>;
    };
    spacing: string[];
    componentPatterns: string[];
}
export interface ScanResult {
    tokens: ExtractedDesignTokens;
    rawMarkdown: string;
}
export declare function scanUrl(url: string, maxPages?: number, depth?: number): Promise<ScanResult>;
export declare function formatExtractionAsMarkdown(tokens: ExtractedDesignTokens): string;
//# sourceMappingURL=extractor.d.ts.map