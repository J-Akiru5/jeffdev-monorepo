/**
 * Prism CLI - Main Entry
 * 
 * Commands:
 * - prism login    : Authenticate with Prism Cloud
 * - prism sync     : Sync rules from cloud to local cache
 * - prism serve    : Start MCP server (for IDE integration)
 * - prism rules    : List rules
 * - prism generate : Generate component with AI (Pro+)
 */

import { Command } from 'commander';
import { login } from './commands/login.js';
import { sync } from './commands/sync.js';
import { serve } from './commands/serve.js';
import { rules } from './commands/rules.js';

const program = new Command();

program
  .name('prism')
  .description('Prism Engine CLI - Context Governance for LLMs')
  .version('0.1.0');

program
  .command('login')
  .description('Authenticate with Prism Cloud')
  .action(login);

program
  .command('sync')
  .description('Sync rules from Prism Cloud')
  .action(sync);

program
  .command('serve')
  .description('Start MCP server for IDE integration')
  .option('-p, --port <port>', 'Port for SSE fallback', '3100')
  .action(serve);

program
  .command('rules')
  .description('List your rules')
  .option('-c, --category <category>', 'Filter by category')
  .action(rules);

program.parse();
