import { scanUrl, type ScanResult } from "../lib/extractor.js";
import {
  generateRulesFromTokens,
  saveRulesLocal,
  type GeneratedRules,
} from "../lib/rule-generator.js";

const RATING_PROMPT =
  "\n\n---\n**Rate these rules** — reply with 👍 if good, 👎 if you want regenerated with a different model.";

export interface PrismScanInput {
  url: string;
  maxPages?: number;
  depth?: number;
  projectId?: string;
  userId?: string;
  model?: string;
}

export interface PrismScanOutput {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

export async function handlePrismScan(
  args: PrismScanInput,
): Promise<PrismScanOutput> {
  const { url, maxPages = 5, depth = 2, projectId, userId, model } = args;

  if (!url || typeof url !== "string") {
    return {
      content: [{ type: "text", text: "Error: `url` is required." }],
      isError: true,
    };
  }

  try {
    // Validate URL
    new URL(url);
  } catch {
    return {
      content: [{ type: "text", text: `Error: "${url}" is not a valid URL.` }],
      isError: true,
    };
  }

  const steps: string[] = [];
  steps.push(`🔍 Scanning ${url}...`);

  let scanResult: ScanResult;
  try {
    scanResult = await scanUrl(url, maxPages, depth);
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Scan failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }

  const { tokens, rawMarkdown } = scanResult;

  if (tokens.pagesScanned === 0) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Could not reach ${url}. Make sure the URL is accessible.`,
        },
      ],
      isError: true,
    };
  }

  steps.push(
    `📄 Scanned ${tokens.pagesScanned} page(s), ~${tokens.tokensUsed} tokens used`,
  );

  // Generate rules via AI
  steps.push(`🤖 Generating rules from extracted design tokens...`);

  let generated: GeneratedRules;
  try {
    generated = await generateRulesFromTokens(tokens, model);
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Rule generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }

  steps.push(
    `✅ Generated ${generated.rulesCount} rules + ${generated.skillsCount} skills (${generated.modelUsed})`,
  );

  // Save locally
  try {
    saveRulesLocal(generated.rulesMd, generated.skillsMd);
    steps.push(`💾 Saved to ~/.prism/rules.md + ~/.prism/skills.md`);
  } catch (error) {
    steps.push(
      `⚠️  Local save failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  // Sync to Cosmos if projectId provided
  if (projectId && userId) {
    try {
      const { saveRulesToCosmos } = await import("../lib/rule-generator.js");
      await saveRulesToCosmos(
        generated.rulesMd,
        generated.skillsMd,
        projectId,
        userId,
      );
      steps.push(`☁️  Synced to Cosmos DB (project: ${projectId})`);
    } catch (error) {
      steps.push(
        `⚠️  Cloud sync failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  const summary = steps.join("\n");

  const detailText = [
    `# Prism Scan Results`,
    ``,
    summary,
    ``,
    `---`,
    ``,
    `## Generated Rules`,
    ``,
    generated.rulesMd,
    ``,
    `---`,
    ``,
    `## Generated Skills`,
    ``,
    generated.skillsMd,
    ``,
    `---`,
    ``,
    `## Raw Extraction Data`,
    ``,
    rawMarkdown,
    RATING_PROMPT,
  ].join("\n");

  return {
    content: [
      {
        type: "text",
        text: detailText,
      },
    ],
  };
}

export async function handleRateRules(
  rating: "good" | "bad",
  url: string,
): Promise<PrismScanOutput> {
  if (rating === "bad") {
    // Re-generate with a different model
    const differentModel = "gemini-flash-lite";
    try {
      const scanResult = await scanUrl(url, 5, 2);
      const generated = await generateRulesFromTokens(
        scanResult.tokens,
        differentModel,
      );
      saveRulesLocal(generated.rulesMd, generated.skillsMd);

      return {
        content: [
          {
            type: "text",
            text: [
              `🔄 Regenerated with ${differentModel}`,
              ``,
              `## Rules`,
              ``,
              generated.rulesMd,
              ``,
              `## Skills`,
              ``,
              generated.skillsMd,
              RATING_PROMPT,
            ].join("\n"),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Regeneration failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }

  return {
    content: [
      {
        type: "text",
        text: '👍 Great! Rules are saved. You can run `prism kitchen analyze --task "..."` to see how they\'ll be used.',
      },
    ],
  };
}
