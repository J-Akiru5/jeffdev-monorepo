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
        // Handle quotes
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        // Handle newlines in private key
        value = value.replace(/\\n/g, '\n');
        process.env[match[1].trim()] = value;
      }
    });
  }
} catch (e) {
  console.error('Failed to load .env.local', e);
}

import { db } from '../src/lib/firebase/admin';

async function main() {
  console.log('--- USERS ---');
  const users = await db.collection('users').limit(2).get();
  users.docs.forEach(doc => {
    console.log(`User: ${doc.id}`);
    const data = doc.data();
    console.log(JSON.stringify(data, null, 2));
    
    // Check key types
    Object.keys(data).forEach(key => {
        const val = data[key];
        if (val && typeof val === 'object') {
            if (val.constructor.name !== 'Object' && val.constructor.name !== 'Array') {
                 console.log(`[ALERT] Field '${key}' has type: ${val.constructor.name}`);
            }
            // Check nested
            if (val.constructor.name === 'Object') {
                 Object.keys(val).forEach(subKey => {
                     const subVal = val[subKey];
                     if (subVal && typeof subVal === 'object' && subVal.constructor.name !== 'Object' && subVal.constructor.name !== 'Array') {
                         console.log(`[ALERT] Field '${key}.${subKey}' has type: ${subVal.constructor.name}`);
                     }
                 });
            }
        }
    });
  });

  console.log('\n--- INVITES ---');
  const invites = await db.collection('invites').limit(2).get();
  invites.docs.forEach(doc => {
    console.log(`Invite: ${doc.id}`);
    const data = doc.data();
    console.log(JSON.stringify(data, null, 2));

     // Check key types
    Object.keys(data).forEach(key => {
        const val = data[key];
        if (val && typeof val === 'object') {
            if (val.constructor.name !== 'Object' && val.constructor.name !== 'Array') {
                 console.log(`[ALERT] Field '${key}' has type: ${val.constructor.name}`);
            }
        }
    });
  });
}

main().catch(console.error);
