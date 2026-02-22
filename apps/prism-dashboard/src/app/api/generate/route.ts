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
import crypto from 'crypto';
import { getCollection } from '@jeffdev/db';
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

    // 🔑 Pre-flight: verify GEMINI_API_KEY exists
    if (!process.env.GEMINI_API_KEY) {
      console.error('[Generate] GEMINI_API_KEY is not set in environment');
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    // TODO: Check subscription limits
    // const subscription = await getSubscription(userId);
    // if (!canUseFeature(subscription.tier, 'aiGenerations', usage)) {
    //   return NextResponse.json({ error: 'AI generation limit reached' }, { status: 403 });
    // }
    
    // Generate component
    let component;
    try {
      component = await generateComponent({
        prompt,
        designSystem,
        stack,
      });
    } catch (genError) {
      console.error('[Generate] Gemini API error:', genError);
      const message = genError instanceof Error ? genError.message : 'Unknown Gemini error';
      return NextResponse.json(
        { error: `AI generation failed: ${message}` },
        { status: 502 }
      );
    }
    
    // Optionally generate rules
    let rules = null;
    if (generateRules && component.code) {
      try {
        const componentName = extractComponentName(component.code) || 'Component';
        const rulesResult = await generateRulesFromComponent({
          componentCode: component.code,
          componentName,
        });
        rules = rulesResult.rules;
      } catch (rulesError) {
        // Don't fail the whole request if rules generation fails
        console.error('[Generate] Rules generation failed:', rulesError);
      }
    }
    
    // Log generation for usage tracking
    try {
      const generationsCollection = await getCollection('generations');
      await generationsCollection.insertOne({
        id: `gen_${crypto.randomBytes(12).toString('hex')}`,
        userId,
        type: 'component',
        prompt: prompt.slice(0, 200), // Store first 200 chars of prompt
        createdAt: new Date().toISOString(),
      });
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('[Generate] Failed to log generation:', logError);
    }
    
    return NextResponse.json({
      success: true,
      component,
      rules,
    });
    
  } catch (error) {
    console.error('[Generate] Unhandled error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to generate component: ${message}` },
      { status: 500 }
    );
  }
}

function extractComponentName(code: string): string | null {
  // Match: export function ComponentName or export const ComponentName
  const match = code.match(/export\s+(?:function|const)\s+(\w+)/);
  return match ? match[1] : null;
}
