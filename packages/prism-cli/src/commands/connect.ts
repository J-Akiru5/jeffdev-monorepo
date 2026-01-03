/**
 * Connect Command
 * 
 * Authenticates with Prism Cloud and establishes MCP connection.
 * Requires Pro+ subscription for IDE sync features.
 * 
 * Usage:
 *   prism connect                    # Uses saved token
 *   PRISM_TOKEN=xxx prism connect    # Uses env token
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { createInterface } from 'readline';

const PRISM_API_URL = process.env.PRISM_API_URL || 'https://prism.jeffdev.studio';
const CONFIG_DIR = join(homedir(), '.prism');
const TOKEN_FILE = join(CONFIG_DIR, 'token');

interface AuthResponse {
  success: boolean;
  tier: string;
  ideSync: boolean;
  userId: string;
  error?: string;
  upgradeUrl?: string;
}

/**
 * Main connect command
 */
export async function connect(): Promise<void> {
  console.log('🔌 Prism Context Engine - Connecting...\n');

  // 1. Get auth token
  let token: string | undefined = process.env.PRISM_TOKEN;

  if (!token) {
    token = loadSavedToken() ?? undefined;
  }

  if (!token) {
    console.log('⚠️  No authentication token found.\n');
    console.log('Options:');
    console.log('  1. Run: prism login');
    console.log('  2. Set PRISM_TOKEN environment variable');
    console.log('  3. Get your token from: https://prism.jeffdev.studio/settings\n');

    token = await promptForToken() ?? undefined;

    if (!token) {
      console.error('❌ Authentication required');
      process.exit(1);
    }
  }

  // 2. Verify token and check tier
  console.log('🔐 Verifying authentication...');
  const auth = await verifyToken(token);

  if (!auth.success) {
    console.error(`❌ ${auth.error || 'Authentication failed'}`);
    if (auth.upgradeUrl) {
      console.log(`\n💡 Upgrade at: ${auth.upgradeUrl}`);
    }
    process.exit(1);
  }

  console.log(`✅ Authenticated as ${auth.userId}`);
  console.log(`📊 Subscription: ${auth.tier.toUpperCase()}\n`);

  // 3. Check IDE sync permission
  if (!auth.ideSync) {
    console.log('━'.repeat(50));
    console.log('⚠️  IDE Sync requires Pro subscription or higher\n');
    console.log('Your current plan: FREE');
    console.log('IDE Sync included in: PRO, TEAM, ENTERPRISE\n');
    console.log('Benefits of upgrading:');
    console.log('  ✓ Unlimited rules');
    console.log('  ✓ IDE integration (Cursor, Windsurf, VS Code)');
    console.log('  ✓ Video transcript context');
    console.log('  ✓ Priority support\n');
    console.log(`🚀 Upgrade now: ${PRISM_API_URL}/subscription`);
    console.log('━'.repeat(50));
    process.exit(0);
  }

  // 4. Save token for future use
  saveToken(token);

  // 5. Start MCP proxy mode
  console.log('🚀 Starting MCP connection...');
  console.log(`📡 Connected to: ${PRISM_API_URL}`);
  console.log('\n✅ Ready! Configure your IDE:\n');
  console.log('Cursor/Windsurf:');
  console.log('  Add to ~/.cursor/mcp.json or ~/.windsurf/mcp.json:');
  console.log(`  {
    "mcpServers": {
      "prism": {
        "command": "npx",
        "args": ["prism-cli", "connect"],
        "env": {
          "PRISM_TOKEN": "${token.slice(0, 8)}..."
        }
      }
    }
  }\n`);

  // Keep process alive for MCP stdio communication
  console.log('⏳ Listening for MCP requests... (Ctrl+C to stop)\n');

  // Simple stdio proxy to deployed server
  await startMcpProxy(token);
}

/**
 * Load saved token from config
 */
function loadSavedToken(): string | null {
  try {
    if (existsSync(TOKEN_FILE)) {
      return readFileSync(TOKEN_FILE, 'utf-8').trim();
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Save token to config
 */
function saveToken(token: string): void {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    writeFileSync(TOKEN_FILE, token);
  } catch {
    // Ignore errors
  }
}

/**
 * Prompt user for token interactively
 */
async function promptForToken(): Promise<string | null> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Enter your Prism token: ', (answer) => {
      rl.close();
      resolve(answer.trim() || null);
    });
  });
}

/**
 * Verify token with Prism API
 */
async function verifyToken(token: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${PRISM_API_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, tier: 'free', ideSync: false, userId: '', error: 'Invalid or expired token' };
      }
      return { success: false, tier: 'free', ideSync: false, userId: '', error: 'Failed to verify token' };
    }

    const data = await response.json() as AuthResponse;
    return data;
  } catch (error) {
    return {
      success: false,
      tier: 'free',
      ideSync: false,
      userId: '',
      error: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Start MCP proxy - forwards stdio to deployed server
 */
async function startMcpProxy(token: string): Promise<void> {
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', async (data: string) => {
    try {
      // Forward MCP request to server
      const response = await fetch(`${PRISM_API_URL}/api/mcp/stdio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: data,
      });

      const result = await response.text();
      process.stdout.write(result);
    } catch (error) {
      const errorResponse = {
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal error' },
        id: null,
      };
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
  });

  // Keep alive
  await new Promise(() => { });
}

