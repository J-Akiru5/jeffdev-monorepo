/**
 * Gemini AI Client
 *
 * Uses Google Generative AI SDK for component generation
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

let _gemini: ReturnType<GoogleGenerativeAI["getGenerativeModel"]> | null = null;

function getGeminiModel() {
  if (_gemini) return _gemini;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it to your environment variables.",
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  _gemini = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  return _gemini;
}

/**
 * Generate a React component based on user prompt and design system
 */
export async function generateComponent({
  prompt,
  designSystem,
  stack,
}: {
  prompt: string;
  designSystem: "jdstudio" | "bare-minimum" | "glassmorphic" | "8bit-nostalgia";
  stack: "react" | "nextjs" | "react-native";
}): Promise<{ code: string; explanation: string }> {
  const systemPrompt = getDesignSystemPrompt(designSystem);
  const stackPrompt = getStackPrompt(stack);

  const fullPrompt = `
You are an expert frontend developer specializing in ${stack} development.

DESIGN SYSTEM RULES:
${systemPrompt}

STACK REQUIREMENTS:
${stackPrompt}

USER REQUEST:
${prompt}

Generate a complete, production-ready component that follows the design system rules strictly.
Return ONLY valid JSON in this format:
{
  "code": "// Full component code here",
  "explanation": "Brief explanation of what was created"
}
`;

  const result = await getGeminiModel().generateContent(fullPrompt);
  const response = result.response.text();

  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      code: "// Error generating component",
      explanation: response,
    };
  }
}

/**
 * Generate architectural rules from a component
 */
export async function generateRulesFromComponent({
  componentCode,
  componentName,
}: {
  componentCode: string;
  componentName: string;
}): Promise<{ rules: string }> {
  const prompt = `
Analyze this React component and generate architectural usage rules for AI coding assistants.

COMPONENT NAME: ${componentName}
COMPONENT CODE:
\`\`\`tsx
${componentCode}
\`\`\`

Generate clear, concise rules that tell an AI assistant:
1. When to use this component
2. Required props and their types
3. Usage patterns and examples
4. Common mistakes to avoid
5. Accessibility considerations

Format as Markdown with headers and code examples.
`;

  const result = await getGeminiModel().generateContent(prompt);
  return { rules: result.response.text() };
}

function getDesignSystemPrompt(system: string): string {
  const prompts: Record<string, string> = {
    jdstudio: `
- Colors: #050505 background, cyan (#06b6d4) and purple (#8b5cf6) accents
- Borders: White at 8% opacity, 15% on hover
- Typography: Inter for headings, JetBrains Mono for data
- Border radius: 6px max (sharp, industrial)
- Effects: Glassmorphism with backdrop-blur, no heavy shadows
- Buttons: Ghost glow style with gradient hover
`,
    "bare-minimum": `
- Colors: Pure black/white only, no color accents
- No shadows, no blur effects
- Border radius: 0-2px only
- 1px borders only
- System fonts
- Generous whitespace
`,
    glassmorphic: `
- Heavy backdrop-filter blur (16-24px)
- Glass surfaces with 5-15% white opacity
- Gradient borders encouraged
- Large border radius (12-24px)
- Floating elements with depth
- Gradient text for headings
`,
    "8bit-nostalgia": `
- Pixel fonts (Press Start 2P)
- Colors: #0f0f23 bg, #00fff5 cyan, #ff00ff magenta
- NO border radius - everything squared
- 4-8px borders only
- Hard drop shadows (no blur)
- Step-based animations
`,
  };

  return prompts[system] || prompts["jdstudio"];
}

function getStackPrompt(stack: string): string {
  const prompts: Record<string, string> = {
    react: `
- Use React 18+ with hooks
- Functional components only
- TypeScript with proper types
- Use props destructuring
- Export as named export
`,
    nextjs: `
- Use Next.js 14+ patterns
- 'use client' for interactive components
- TypeScript with proper types
- Use Next.js Link for navigation
- Export as named export
`,
    "react-native": `
- Use React Native core components
- StyleSheet.create for styles
- TypeScript with proper types
- Use Pressable for buttons
- Handle platform differences
`,
  };

  return prompts[stack] || prompts["nextjs"];
}

/**
 * Enhance a rule using Gemini AI
 * Improves clarity, adds examples, and makes the rule more actionable.
 */
export interface EnhanceRuleResult {
  enhancedContent: string;
  suggestions: string[];
  processingTime: number;
}

export async function enhanceRuleWithAI(
  ruleName: string,
  ruleContent: string,
  category: string,
): Promise<EnhanceRuleResult> {
  const startTime = Date.now();
  const model = getGeminiModel();

  const systemPrompt = `You are Prism, an expert software architecture documentation writer. Your task is to enhance architectural rules for a Context Engine that guides AI coding assistants.

When enhancing a rule:
1. REWRITE the rule in a commanding tone starting with "You must...", "You should...", or "Never..."
2. EXPAND the core idea into a clear, detailed explanation (2-4 paragraphs)
3. IF multiple sub-rules are detected, FORMAT them as an enumerated list
4. ADD a relevant code example in JavaScript or TypeScript
5. INCLUDE both ✅ (correct) and ❌ (incorrect) patterns when applicable
6. PRESERVE the original intent - do not change the meaning
7. USE markdown formatting for readability

Output Format:
- Start with the commanding statement
- Add explanation paragraphs
- Use numbered lists for multiple sub-rules
- Add code examples in fenced code blocks (use \`\`\`typescript or \`\`\`javascript)
- Keep total length reasonable (300-500 words max)
- Do NOT add meta-commentary like "Here's the enhanced version"`;

  const userPrompt = `Enhance this architectural rule:

Rule Title: ${ruleName}
Category: ${category}
Current Content:
${ruleContent}

Respond with ONLY valid JSON:
{
  "enhancedContent": "The improved rule content in markdown format",
  "suggestions": ["Optional suggestion for further improvement", "Another suggestion if applicable"]
}`;

  try {
    const result = await model.generateContent(
      `${systemPrompt}\n\n${userPrompt}`,
    );
    const response = result.response.text();

    // Extract JSON from response (might be wrapped in markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from Gemini response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      enhancedContent: string;
      suggestions: string[];
    };

    return {
      ...parsed,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error("[Gemini] Enhancement failed:", error);
    throw new Error(
      `Failed to enhance rule: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
