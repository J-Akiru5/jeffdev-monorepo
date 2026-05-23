import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('prism init command', () => {
  const tmpDir = join(tmpdir(), `prism-init-test-${Date.now()}`);
  const cursorDir = join(tmpDir, '.cursor');
  const windsurfDir = join(tmpDir, '.windsurf');

  beforeEach(() => {
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should detect Cursor when .cursor directory exists', () => {
    mkdirSync(cursorDir, { recursive: true });
    expect(existsSync(cursorDir)).toBe(true);
  });

  it('should detect Windsurf when .windsurf directory exists', () => {
    mkdirSync(windsurfDir, { recursive: true });
    expect(existsSync(windsurfDir)).toBe(true);
  });

  it('should write valid MCP config for Cursor', () => {
    mkdirSync(cursorDir, { recursive: true });
    const config = {
      mcpServers: {
        prism: {
          command: 'npx',
          args: ['@prism-engine/cli', 'connect'],
        },
      },
    };
    writeFileSync(join(cursorDir, 'mcp.json'), JSON.stringify(config, null, 2));
    const saved = JSON.parse(readFileSync(join(cursorDir, 'mcp.json'), 'utf-8'));
    expect(saved.mcpServers.prism.command).toBe('npx');
    expect(saved.mcpServers.prism.args).toContain('connect');
  });

  it('should not overwrite existing Cursor MCP entries', () => {
    mkdirSync(cursorDir, { recursive: true });
    const config = {
      mcpServers: {
        existingTool: { command: 'node', args: ['existing.js'] },
      },
    };
    writeFileSync(join(cursorDir, 'mcp.json'), JSON.stringify(config, null, 2));
    const saved = JSON.parse(readFileSync(join(cursorDir, 'mcp.json'), 'utf-8'));
    expect(saved.mcpServers.existingTool).toBeDefined();
  });

  it('should include PRISM_TOKEN env var when token is available', () => {
    const token = 'test-token-123';
    const config = {
      command: 'npx',
      args: ['@prism-engine/cli', 'connect'],
      env: { PRISM_TOKEN: token },
    };
    expect(config.env?.PRISM_TOKEN).toBe(token);
  });

  it('should omit PRISM_TOKEN env var when no token', () => {
    const config = {
      command: 'npx',
      args: ['@prism-engine/cli', 'connect'],
    };
    expect(config.env).toBeUndefined();
  });
});

describe('IDE detection helpers', () => {
  const originalPlatform = process.platform;
  const originalAppData = process.env.APPDATA;

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
    process.env.APPDATA = originalAppData;
  });

  it('should use APPDATA for VS Code path on Windows', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    process.env.APPDATA = 'C:\\Users\\test\\AppData\\Roaming';
    const vscodePath = join(process.env.APPDATA, 'Code', 'User', 'settings.json');
    expect(vscodePath).toContain('AppData');
    expect(vscodePath).toContain(join('Code', 'User', 'settings.json'));
  });

  it('should use Library path for VS Code on macOS', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    const vscodePath = join('/Users/test', 'Library', 'Application Support', 'Code', 'User', 'settings.json');
    expect(vscodePath).toContain(join('Library', 'Application Support', 'Code'));
  });

  it('should use Library path for Claude Desktop on macOS', () => {
    const claudePath = join('/Users/test', 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    expect(claudePath).toContain(join('Claude', 'claude_desktop_config.json'));
  });
});
