import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db";

/**
 * Brand Export API
 * Generates Prism Rules in various formats for different IDEs.
 * 
 * GET /api/brand/export?slug=brand-slug&format=cursor
 * 
 * Formats:
 * - cursor: .cursorrules file
 * - windsurf: .windsurfrules file
 * - vscode: VS Code settings.json snippet
 * - claude: CLAUDE.md file
 * - css: CSS custom properties
 * - tailwind: Tailwind config theme
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const format = searchParams.get("format") || "cursor";

  if (!slug) {
    return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
  }

  // Fetch brand
  const brandsCollection = await getCollection("brands");
  const brand = await brandsCollection.findOne({ userId, slug });

  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  // Generate content based on format
  let content: string;
  let filename: string;
  let contentType: string;

  switch (format) {
    case "cursor":
      content = generateCursorRules(brand as unknown as BrandDoc);
      filename = ".cursorrules";
      contentType = "text/plain";
      break;
    case "windsurf":
      content = generateWindsurfRules(brand as unknown as BrandDoc);
      filename = ".windsurfrules";
      contentType = "text/plain";
      break;
    case "vscode":
      content = generateVSCodeSettings(brand as unknown as BrandDoc);
      filename = "settings.json";
      contentType = "application/json";
      break;
    case "claude":
      content = generateClaudeInstructions(brand as unknown as BrandDoc);
      filename = "CLAUDE.md";
      contentType = "text/markdown";
      break;
    case "css":
      content = generateCSSVariables(brand as unknown as BrandDoc);
      filename = "brand-tokens.css";
      contentType = "text/css";
      break;
    case "tailwind":
      content = generateTailwindConfig(brand as unknown as BrandDoc);
      filename = "tailwind.config.brand.js";
      contentType = "text/javascript";
      break;
    default:
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }

  return new NextResponse(content, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

// Type for brand document
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

/**
 * Generate .cursorrules file
 */
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
5. Border radius should be: ${brand.spacing?.borderRadius || "sm"}

## Code Conventions
- Use CSS variables for colors: --brand-primary, --brand-accent, etc.
- Import fonts from Google Fonts or your font provider
- Follow ${brand.voice.formality} language in comments and documentation
`;
}

/**
 * Generate .windsurfrules file
 */
function generateWindsurfRules(brand: BrandDoc): string {
  // Windsurf uses similar format to Cursor
  return generateCursorRules(brand);
}

/**
 * Generate VS Code settings snippet
 */
function generateVSCodeSettings(brand: BrandDoc): string {
  return JSON.stringify({
    "prism.brand": {
      name: brand.companyName,
      colors: brand.colors,
      typography: brand.typography,
      voice: brand.voice,
    },
    "editor.tokenColorCustomizations": {
      comments: brand.colors.textMuted,
      strings: brand.colors.accent,
    },
  }, null, 2);
}

/**
 * Generate CLAUDE.md instructions
 */
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
4. Use ${brand.typography.headingFont} font-family for all headings
`;
}

/**
 * Generate CSS custom properties
 */
function generateCSSVariables(brand: BrandDoc): string {
  return `:root {
  /* ${brand.companyName} Brand Colors */
  --brand-primary: ${brand.colors.primary};
  --brand-secondary: ${brand.colors.secondary};
  --brand-accent: ${brand.colors.accent};
  --brand-background: ${brand.colors.background};
  --brand-surface: ${brand.colors.surface};
  --brand-text: ${brand.colors.text};
  --brand-text-muted: ${brand.colors.textMuted};

  /* Typography */
  --font-heading: "${brand.typography.headingFont}", sans-serif;
  --font-body: "${brand.typography.bodyFont}", sans-serif;
  ${brand.typography.monoFont ? `--font-mono: "${brand.typography.monoFont}", monospace;` : ""}

  /* Spacing */
  --spacing-unit: ${brand.spacing?.unit || 4}px;
  --radius-${brand.spacing?.borderRadius || "sm"}: ${getRadiusValue(brand.spacing?.borderRadius || "sm")};
}
`;
}

/**
 * Generate Tailwind config theme extension
 */
function generateTailwindConfig(brand: BrandDoc): string {
  return `// ${brand.companyName} Tailwind Theme Extension
// Add this to your tailwind.config.js theme.extend

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
        ${brand.typography.monoFont ? `mono: ["${brand.typography.monoFont}", "monospace"],` : ""}
      },
    },
  },
};
`;
}

function getRadiusValue(size: string): string {
  const map: Record<string, string> = {
    none: "0px",
    sm: "4px",
    md: "6px",
    lg: "12px",
    full: "9999px",
  };
  return map[size] || "4px";
}
