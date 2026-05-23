/**
 * Test Azure OpenAI Integration
 * 
 * Quick script to verify Azure OpenAI credentials and rule extraction works
 * 
 * Usage:
 *   npx tsx scripts/test-azure-openai.ts
 */

import { extractRulesFromTranscript } from '../src/lib/azure-openai';

const sampleTranscript = `
In this project, we follow strict TypeScript conventions for type safety.
Never use 'any' types - always create proper interfaces for your data structures.

All React components must be functional components using hooks.
We organize components in the components/ folder by feature, not by type.

For state management, we use React Context API for simple cases,
and only reach for Redux when we have complex global state.

Always write unit tests for utility functions using Vitest.
Aim for at least 80% code coverage on critical business logic.

API calls should always include proper error handling with try-catch blocks.
Never expose sensitive data in client-side code.
`;

async function testAzureOpenAI() {
  console.log('🧪 Testing Azure OpenAI Integration...\n');
  
  try {
    console.log('📝 Sample transcript length:', sampleTranscript.length, 'characters');
    console.log('\n🤖 Sending to Azure OpenAI (GPT-4o-mini)...\n');
    
    const startTime = Date.now();
    const result = await extractRulesFromTranscript(
      sampleTranscript,
      'Test Video - TypeScript Best Practices',
      'test-project'
    );
    const duration = Date.now() - startTime;
    
    console.log('✅ SUCCESS! Rule extraction completed\n');
    console.log('📊 Results:');
    console.log('  - Rules extracted:', result.rules.length);
    console.log('  - Confidence:', result.confidence);
    console.log('  - Processing time:', duration, 'ms');
    console.log('  - AI processing time:', result.processingTime, 'ms');
    console.log('\n📋 Summary:', result.summary);
    
    console.log('\n📝 Extracted Rules:\n');
    result.rules.forEach((rule, index) => {
      console.log(`${index + 1}. ${rule.title}`);
      console.log(`   Category: ${rule.category}`);
      console.log(`   Priority: ${rule.priority}`);
      console.log(`   Tags: ${rule.tags.join(', ')}`);
      console.log(`   Description: ${rule.description.substring(0, 100)}...`);
      console.log('');
    });
    
    console.log('✅ Azure OpenAI is configured correctly!');
    console.log('🎉 Ready to process real video transcripts.\n');
    
  } catch (error) {
    console.error('❌ Test FAILED\n');
    
    if (error instanceof Error) {
      if (error.message.includes('not configured')) {
        console.error('🔧 Azure OpenAI credentials missing!');
        console.error('\nPlease add to .env.local:');
        console.error('  AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/');
        console.error('  AZURE_OPENAI_API_KEY=your-api-key');
        console.error('  AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini');
      } else if (error.message.includes('Deployment')) {
        console.error('🔧 Deployment name mismatch!');
        console.error('\nCheck your Azure OpenAI Studio:');
        console.error('  1. Go to Deployments tab');
        console.error('  2. Copy exact deployment name');
        console.error('  3. Update AZURE_OPENAI_DEPLOYMENT_NAME in .env.local');
      } else {
        console.error('Error:', error.message);
      }
    } else {
      console.error('Unknown error:', error);
    }
    
    process.exit(1);
  }
}

testAzureOpenAI();
