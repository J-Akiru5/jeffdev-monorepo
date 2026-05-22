import { homedir } from "os";
import { join } from "path";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { generateContent } from "./ai-router.js";
const CHAT_MODEL = process.env.GEMINI_MODEL || process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gemini-3.5-flash";
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}
export async function generateRulesFromTokens(tokens, modelOverride) {
    const model = modelOverride || CHAT_MODEL;
    const extractionSummary = [
        `URL: ${tokens.url}`,
        `Pages scanned: ${tokens.pagesScanned}`,
        `CSS variables: ${Object.keys(tokens.cssVariables).length}`,
        `Colors found: ${tokens.colors.length}`,
        `Typography: ${Object.keys(tokens.typography.headings || {}).length} heading levels`,
        `Spacing values: ${tokens.spacing.length}`,
        `Component patterns: ${tokens.componentPatterns.length}`,
    ].join("\n");
    const cssVarBlock = Object.entries(tokens.cssVariables)
        .slice(0, 40)
        .map(([k, v]) => `--${k}: ${v}`)
        .join("\n");
    const colorBlock = tokens.colors.join(", ");
    const headingBlock = tokens.typography.headings
        ? Object.entries(tokens.typography.headings)
            .map(([tag, h]) => `${tag}: ${h.fontSize} / ${h.fontWeight}`)
            .join("\n")
        : "none";
    const patternBlock = tokens.componentPatterns.join(", ");
    const prompt = `You are a senior front-end architect. Given the design token extraction below, generate two markdown files.

## RULES.MD
Write 5-15 concise, enforceable rules for an AI coding assistant. Each rule must start with a bold **title** on its own line, followed by a short paragraph. Cover:
1. Color usage — which colors to use and where
2. Typography — font sizes, weights, heading hierarchy
3. Spacing — the spacing scale to use
4. CSS custom properties — which variables are available
5. Component naming conventions (BEM, etc.) based on detected patterns

Format each rule like:
**Rule title**
Rule description with specific values from the extraction below.

## SKILLS.MD
Write 2-5 procedural skill guides. Each is a "how-to" for a specific task a junior dev might attempt (e.g., "Styling a button", "Adding a new page"). Start each with a bold **title**.

---

### Extraction Data

${extractionSummary}

**CSS Variables:**
${cssVarBlock || "none detected"}

**Colors:**
${colorBlock || "none detected"}

**Typography Headings:**
${headingBlock || "none detected"}

**Spacing Values:**
${tokens.spacing.length > 0 ? tokens.spacing.join(", ") : "none detected"}

**Component Class Patterns:**
${patternBlock || "none detected"}
`;
    const fullOutput = await generateContent("You are an expert front-end architect. Output rules and skills in clean markdown. Be specific, actionable, and reference exact values from the extraction data.", prompt);
    // Split the output into rules and skills sections
    let rulesMd = "";
    let skillsMd = "";
    const skillsIndex = fullOutput.search(/## SKILLS\.MD|# Skills|## Skills/i);
    if (skillsIndex !== -1) {
        rulesMd = fullOutput.slice(0, skillsIndex).trim();
        skillsMd = fullOutput.slice(skillsIndex).trim();
    }
    else {
        // If model didn't split cleanly, treat everything as rules
        rulesMd = fullOutput.trim();
        skillsMd = "# Skills\n\nNo skill guides were generated automatically. Add them manually.";
    }
    const rulesCount = (rulesMd.match(/\*\*[^*]+\*\*/g) || []).length;
    const skillsCount = (skillsMd.match(/\*\*[^*]+\*\*/g) || []).length;
    return {
        rulesMd,
        skillsMd,
        rulesCount,
        skillsCount,
        modelUsed: model,
    };
}
export function saveRulesLocal(rulesMd, skillsMd) {
    const prismDir = join(homedir(), ".prism");
    if (!existsSync(prismDir)) {
        mkdirSync(prismDir, { recursive: true });
    }
    writeFileSync(join(prismDir, "rules.md"), rulesMd);
    writeFileSync(join(prismDir, "skills.md"), skillsMd);
}
export async function saveRulesToCosmos(rulesMd, skillsMd, projectId, userId) {
    const { getCollection } = await import("@jeffdev/db/cosmos");
    const collection = await getCollection("rules");
    await collection.insertOne({
        id: `scan-${Date.now()}`,
        name: `Playwright Scan - ${new Date().toISOString().slice(0, 10)}`,
        description: "Auto-generated rules from Playwright URL scan",
        category: "custom",
        content: rulesMd,
        skillsContent: skillsMd,
        projectId,
        userId,
        isActive: true,
        priority: 50,
        source: "playwright",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
}
