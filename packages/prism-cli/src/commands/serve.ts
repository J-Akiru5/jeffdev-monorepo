/**
 * Serve Command
 * 
 * Starts the local MCP server that bridges to Prism Cloud
 */

import chalk from 'chalk';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { loadConfig, isAuthenticated } from '../config.js';
import { join } from 'path';
import { homedir } from 'os';
import { readFileSync, existsSync } from 'fs';

const RULES_CACHE = join(homedir(), '.prism', 'rules', 'rules.json');

interface ServeOptions {
  port?: string;
}

export async function serve(options: ServeOptions): Promise<void> {
  console.log(chalk.cyan('◈ Prism MCP Server starting...'));
  
  // Load cached rules (or empty if not synced)
  let rules: Array<{ id: string; slug: string; category: string; content: string }> = [];
  
  if (existsSync(RULES_CACHE)) {
    try {
      rules = JSON.parse(readFileSync(RULES_CACHE, 'utf-8'));
    } catch {
      console.log(chalk.yellow('⚠ No cached rules. Run `prism sync` first.'));
    }
  }
  
  const server = new Server(
    {
      name: 'prism-mcp-server',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );
  
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'get_architectural_rules',
        description: 'Get architectural rules and coding standards for the current project',
        inputSchema: {
          type: 'object' as const,
          properties: {
            category: {
              type: 'string',
              description: 'Filter by category (e.g., design-system, security, tech-stack)',
            },
          },
        },
      },
      {
        name: 'get_rule_content',
        description: 'Get the full content of a specific rule by its slug',
        inputSchema: {
          type: 'object' as const,
          properties: {
            slug: {
              type: 'string',
              description: 'The unique slug of the rule',
            },
          },
          required: ['slug'],
        },
      },
    ],
  }));
  
  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    if (name === 'get_architectural_rules') {
      const category = (args as { category?: string })?.category;
      
      let filtered = rules;
      if (category) {
        filtered = rules.filter(r => r.category === category);
      }
      
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              filtered.map(r => ({ slug: r.slug, category: r.category })),
              null,
              2
            ),
          },
        ],
      };
    }
    
    if (name === 'get_rule_content') {
      const slug = (args as { slug: string }).slug;
      const rule = rules.find(r => r.slug === slug);
      
      if (!rule) {
        return {
          content: [{ type: 'text' as const, text: `Rule not found: ${slug}` }],
          isError: true,
        };
      }
      
      return {
        content: [{ type: 'text' as const, text: rule.content }],
      };
    }
    
    return {
      content: [{ type: 'text' as const, text: `Unknown tool: ${name}` }],
      isError: true,
    };
  });
  
  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.log(chalk.green('✓ MCP Server running (stdio transport)'));
  console.log(chalk.dim(`  Rules loaded: ${rules.length}`));
}
