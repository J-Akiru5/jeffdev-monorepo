import { NextRequest, NextResponse } from "next/server";
import { getPrismDb, isValidId } from "@syntaxure-labs/db/prism";
import { authenticate, errorResponse } from "@/lib/api-auth";

const FORMATS = [
  "cursor",
  "windsurf",
  "vscode",
  "claude",
  "css",
  "tailwind",
] as const;

type BrandDoc = {
  companyName: string;
  tagline?: string;
  industry: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    monoFont?: string;
    scale: string;
  };
  voice: {
    personality: string;
    formality: string;
    keywords: string[];
  };
  spacing?: {
    unit?: number;
    borderRadius?: string;
  };
};

function generateCursorRules(brand: BrandDoc): string {
  return `# ${brand.companyName} - Design System Rules

## Brand Identity
Company: ${brand.companyName}
${brand.tagline ? `Tagline: "${brand.tagline}"` : ""}
Industry: ${brand.industry}

## Color Palette
- Primary: ${brand.colors.primary}
- Secondary: ${brand.colors.secondary}
- Accent: ${brand.colors.accent}
- Background: ${brand.colors.background}
- Surface: ${brand.colors.surface}
- Text: ${brand.colors.text}
- Text Muted: ${brand.colors.textMuted}

## Typography
- Heading Font: "${brand.typography.headingFont}"
- Body Font: "${brand.typography.bodyFont}"
${brand.typography.monoFont ? `- Mono Font: "${brand.typography.monoFont}"` : ""}
- Scale: ${brand.typography.scale}

## Voice & Tone
- Personality: ${brand.voice.personality}
- Formality: ${brand.voice.formality}
${brand.voice.keywords?.length > 0 ? `- Keywords: ${brand.voice.keywords.join(", ")}` : ""}

## Component Guidelines
1. Use the defined color palette consistently
2. Apply ${brand.typography.headingFont} for all headings
3. Apply ${brand.typography.bodyFont} for body text
4. Maintain ${brand.voice.personality} tone in all copy
5. Border radius should be: ${brand.spacing?.borderRadius || "sm"}`;
}

function generateVSCodeSettings(brand: BrandDoc): string {
  return JSON.stringify(
    {
      "prism.brand": {
        name: brand.companyName,
        colors: brand.colors,
        typography: brand.typography,
        voice: brand.voice,
      },
    },
    null,
    2,
  );
}

function generateClaudeInstructions(brand: BrandDoc): string {
  return `# ${brand.companyName} Brand Guidelines for Claude

When generating code or content for ${brand.companyName}, follow these guidelines:

## Visual Design
- **Primary Color**: ${brand.colors.primary}
- **Accent Color**: ${brand.colors.accent}
- **Background**: ${brand.colors.background}
- **Typography**: ${brand.typography.headingFont} for headings, ${brand.typography.bodyFont} for body

## Voice & Tone
- **Personality**: ${brand.voice.personality}
- **Formality**: ${brand.voice.formality}
- **Key Words**: ${brand.voice.keywords?.join(", ") || "N/A"}

## Important Rules
1. Always use the brand color palette when generating UI code
2. Write copy that reflects a ${brand.voice.personality} and ${brand.voice.formality} tone
3. Reference the brand keywords when writing marketing copy
4. Use ${brand.typography.headingFont} font-family for all headings`;
}

function generateCSSVariables(brand: BrandDoc): string {
  const radiusMap: Record<string, string> = {
    none: "0px",
    sm: "4px",
    md: "6px",
    lg: "12px",
    full: "9999px",
  };
  const radius = brand.spacing?.borderRadius || "sm";
  return `:root {
  --brand-primary: ${brand.colors.primary};
  --brand-secondary: ${brand.colors.secondary};
  --brand-accent: ${brand.colors.accent};
  --brand-background: ${brand.colors.background};
  --brand-surface: ${brand.colors.surface};
  --brand-text: ${brand.colors.text};
  --brand-text-muted: ${brand.colors.textMuted};
  --font-heading: "${brand.typography.headingFont}", sans-serif;
  --font-body: "${brand.typography.bodyFont}", sans-serif;
${brand.typography.monoFont ? `  --font-mono: "${brand.typography.monoFont}", monospace;` : ""}
  --spacing-unit: ${brand.spacing?.unit || 4}px;
  --radius-${radius}: ${radiusMap[radius] || "4px"};
}`;
}

function generateTailwindConfig(brand: BrandDoc): string {
  return `// ${brand.companyName} Tailwind Theme Extension
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "${brand.colors.primary}",
          secondary: "${brand.colors.secondary}",
          accent: "${brand.colors.accent}",
          background: "${brand.colors.background}",
          surface: "${brand.colors.surface}",
          text: "${brand.colors.text}",
          muted: "${brand.colors.textMuted}",
        },
      },
      fontFamily: {
        heading: ["${brand.typography.headingFont}", "sans-serif"],
        body: ["${brand.typography.bodyFont}", "sans-serif"],
${brand.typography.monoFont ? `        mono: ["${brand.typography.monoFont}", "monospace"],` : ""}
      },
    },
  },
};`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!isValidId(id)) return errorResponse("Invalid brand ID", 400);

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "cursor";
  if (!FORMATS.includes(format as (typeof FORMATS)[number]))
    return errorResponse("Invalid format", 400);

  const db = getPrismDb();
  const { data: brand } = await db
    .from("prism_brands")
    .select(
      "companyName:company_name, tagline, industry, colors, typography, voice, spacing",
    )
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!brand) return errorResponse("Brand not found", 404);

  const doc = brand as unknown as BrandDoc;
  let content: string;
  let filename: string;
  let contentType: string;

  switch (format) {
    case "cursor":
    case "windsurf":
      content = generateCursorRules(doc);
      filename = format === "cursor" ? ".cursorrules" : ".windsurfrules";
      contentType = "text/plain";
      break;
    case "vscode":
      content = generateVSCodeSettings(doc);
      filename = "settings.json";
      contentType = "application/json";
      break;
    case "claude":
      content = generateClaudeInstructions(doc);
      filename = "CLAUDE.md";
      contentType = "text/markdown";
      break;
    case "css":
      content = generateCSSVariables(doc);
      filename = "brand-tokens.css";
      contentType = "text/css";
      break;
    case "tailwind":
      content = generateTailwindConfig(doc);
      filename = "tailwind.config.brand.js";
      contentType = "text/javascript";
      break;
    default:
      return errorResponse("Invalid format", 400);
  }

  return new NextResponse(content, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
