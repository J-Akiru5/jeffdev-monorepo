/**
 * Connect Command
 * 
 * Launches the Prism MCP server in stdio mode for IDE integration.
 * This command is meant to be called by IDEs (Cursor, Windsurf, etc.)
 * via their MCP configuration.
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function connect(): Promise<void> {
  // Find the MCP server executable
  // __dirname will be packages/prism-cli/dist/commands (when built)
  // We need to go up to monorepo root: ../../.. -> packages/prism-cli/dist -> packages/prism-cli -> packages -> root
  // But we need one more level: ../../../.. to get to root
  const mcpServerPath = join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'apps',
    'prism-mcp-server',
    'dist',
    'index.js'
  );

  if (!existsSync(mcpServerPath)) {
    console.error(
      '[prism connect] Error: MCP server not built.\n' +
      'Run: cd apps/prism-mcp-server && npm run build'
    );
    process.exit(1);
  }

  // Spawn the MCP server with stdio transport
  const mcpServer = spawn('node', [mcpServerPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      // Ensure env vars are passed through
      MONGODB_URI: process.env.MONGODB_URI || process.env.COSMOS_CONNECTION_STRING,
      COSMOS_DATABASE_NAME: process.env.COSMOS_DATABASE_NAME || 'prism',
    },
  });

  mcpServer.on('error', (error) => {
    console.error('[prism connect] Failed to start MCP server:', error);
    process.exit(1);
  });

  mcpServer.on('exit', (code) => {
    if (code !== 0) {
      console.error(`[prism connect] MCP server exited with code ${code}`);
      process.exit(code || 1);
    }
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    mcpServer.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    mcpServer.kill('SIGTERM');
  });
}
