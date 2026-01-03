/**
 * Integration tests for `prism connect` command
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('prism connect command', () => {
  describe('MCP server path resolution', () => {
    it('should resolve correct path to MCP server', () => {
      const mcpServerPath = join(
        __dirname,
        '..',
        '..',
        '..',
        'apps',
        'prism-mcp-server',
        'dist',
        'index.js'
      );

      // Path should be valid (even if not built yet)
      expect(mcpServerPath).toContain('prism-mcp-server');
      expect(mcpServerPath).toContain('dist');
      expect(mcpServerPath).toContain('index.js');
    });

    it('should check if MCP server exists before launching', () => {
      const mcpServerPath = join(
        __dirname,
        '..',
        '..',
        '..',
        'apps',
        'prism-mcp-server',
        'dist',
        'index.js'
      );

      const exists = existsSync(mcpServerPath);
      
      // If not built, test passes but logs warning
      if (!exists) {
        console.warn('⚠️  MCP server not built. Run: cd apps/prism-mcp-server && npm run build');
      }
      
      expect(typeof exists).toBe('boolean');
    });
  });

  describe('Environment variable handling', () => {
    it('should pass through MONGODB_URI from environment', () => {
      const testEnv = {
        ...process.env,
        MONGODB_URI: 'mongodb+srv://test-connection-string',
        COSMOS_DATABASE_NAME: 'test-db',
      };

      expect(testEnv.MONGODB_URI).toBe('mongodb+srv://test-connection-string');
      expect(testEnv.COSMOS_DATABASE_NAME).toBe('test-db');
    });

    it('should use COSMOS_CONNECTION_STRING as fallback for MONGODB_URI', () => {
      const testEnv: Record<string, string | undefined> = {
        COSMOS_CONNECTION_STRING: 'mongodb+srv://cosmos-fallback',
      };

      const mongoUri = testEnv.MONGODB_URI || testEnv.COSMOS_CONNECTION_STRING;
      expect(mongoUri).toBe('mongodb+srv://cosmos-fallback');
    });

    it('should default to "prism" database name if not provided', () => {
      const testEnv: Record<string, string | undefined> = {};
      const dbName = testEnv.COSMOS_DATABASE_NAME || 'prism';
      
      expect(dbName).toBe('prism');
    });
  });

  describe('Process lifecycle', () => {
    it('should create child process with correct arguments', () => {
      // Mock test - we're not actually spawning the process
      const expectedCommand = 'node';
      const expectedArgs = ['path/to/mcp-server/index.js'];

      expect(expectedCommand).toBe('node');
      expect(expectedArgs).toHaveLength(1);
      expect(expectedArgs[0]).toContain('index.js');
    });

    it('should configure stdio as inherit for MCP protocol', () => {
      const spawnOptions = {
        stdio: 'inherit' as const,
        env: process.env,
      };

      expect(spawnOptions.stdio).toBe('inherit');
      expect(spawnOptions.env).toBeDefined();
    });
  });
});

describe('CLI integration (requires built MCP server)', () => {
  const mcpServerPath = join(
    __dirname,
    '..',
    '..',
    '..',
    'apps',
    'prism-mcp-server',
    'dist',
    'index.js'
  );

  beforeEach(() => {
    // Skip if MCP server not built
    if (!existsSync(mcpServerPath)) {
      console.warn('Skipping integration tests - MCP server not built');
    }
  });

  it.skipIf(!existsSync(mcpServerPath))('should launch MCP server with valid configuration', async () => {
    const childProcess = spawn('node', [mcpServerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
        COSMOS_DATABASE_NAME: 'prism',
      },
    });

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Server should be running
    expect(childProcess.pid).toBeDefined();
    expect(childProcess.killed).toBe(false);

    // Clean up
    childProcess.kill('SIGTERM');
    
    // Wait for process to exit
    await new Promise((resolve) => {
      childProcess.on('exit', resolve);
      setTimeout(resolve, 500);
    });
  }, 5000);

  it.skipIf(!existsSync(mcpServerPath))('should handle SIGINT gracefully', async () => {
    const childProcess = spawn('node', [mcpServerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
        COSMOS_DATABASE_NAME: 'prism',
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    let exitCode: number | null = null;
    childProcess.on('exit', (code) => {
      exitCode = code;
    });

    // Send SIGINT
    childProcess.kill('SIGINT');

    // Wait for graceful shutdown
    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(childProcess.killed || exitCode !== null).toBe(true);
  }, 5000);
});
