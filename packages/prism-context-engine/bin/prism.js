#!/usr/bin/env node

/**
 * Prism CLI - Entry Point
 * 
 * This is the thin local client that bridges your IDE (Cursor/Windsurf)
 * to Prism Cloud via the MCP protocol.
 */

import('../dist/index.js').catch((err) => {
  console.error('Failed to start Prism CLI:', err.message);
  process.exit(1);
});
