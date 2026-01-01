/**
 * Component Generation API
 * 
 * POST /api/generate
 * Generates a component using Gemini AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateComponent, generateRulesFromComponent } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { prompt, designSystem, stack, generateRules } = body;
    
    if (!prompt || !designSystem || !stack) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, designSystem, stack' },
        { status: 400 }
      );
    }
    
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
