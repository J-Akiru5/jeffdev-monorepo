/**
 * Component Generation API
 * 
 * POST /api/generate
 * Generates a component using Gemini AI
 * 
 * @security Clerk Auth + Zod Validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { generateComponent, generateRulesFromComponent } from '@/lib/gemini';

/**
 * 🛡️ Zod Gate - Input Validation Schema
 * Validates input types match the generateComponent function requirements.
 */
const GenerateRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt cannot be empty")
    .max(5000, "Prompt too long (max 5000 chars)"),
  designSystem: z.enum(["jdstudio", "bare-minimum", "glassmorphic", "8bit-nostalgia"]),
  stack: z.enum(["react", "nextjs", "react-native"]),
  generateRules: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    
    // 🛡️ The Guard - Zod Validation
    const parsed = GenerateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    
    const { prompt, designSystem, stack, generateRules } = parsed.data;

    // TODO: Check subscription limits
    // const subscription = await getSubscription(userId);
    // if (!canUseFeature(subscription.tier, 'aiGenerations', usage)) {
    //   return NextResponse.json({ error: 'AI generation limit reached' }, { status: 403 });
    // }
    
    // Generate component
    const component = await generateComponent({
      prompt,
      designSystem,
      stack,
    });
    
    // Optionally generate rules
    let rules = null;
    if (generateRules && component.code) {
      const componentName = extractComponentName(component.code) || 'Component';
      const rulesResult = await generateRulesFromComponent({
        componentCode: component.code,
        componentName,
      });
      rules = rulesResult.rules;
    }
    
    // TODO: Increment usage counter
    // await incrementUsage(userId, 'aiGenerations');
    
    return NextResponse.json({
      success: true,
      component,
      rules,
    });
    
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate component' },
      { status: 500 }
    );
  }
}

function extractComponentName(code: string): string | null {
  // Match: export function ComponentName or export const ComponentName
  const match = code.match(/export\s+(?:function|const)\s+(\w+)/);
  return match ? match[1] : null;
}
