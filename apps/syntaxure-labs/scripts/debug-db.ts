/**
 * DB Debug Script
 * ---------------
 * Debug Supabase data types and field values.
 * Run: npx tsx scripts/debug-db.ts
 */

import fs from 'fs';
import path from 'path';

// Manually load env
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        value = value.replace(/\\n/g, '\n');
        process.env[match[1].trim()] = value;
      }
    });
  }
} catch (e) {
  console.error('Failed to load .env.local', e);
}

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  console.log('--- USER PROFILES ---');
  const { data: users } = await supabase.from('user_profiles').select('*').limit(2);
  console.log(JSON.stringify(users, null, 2));

  console.log('\n--- INVITES ---');
  const { data: invites } = await supabase.from('invites').select('*').limit(2);
  console.log(JSON.stringify(invites, null, 2));
}

main().catch(console.error);
