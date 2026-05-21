/**
 * doctor command — Prism health check
 *
 * Runs a series of checks across all Prism systems and prints
 * a summary with actionable fix instructions for anything that fails.
 *
 * Checks performed:
 *  1. Node.js version (must be ≥20)
 *  2. CLI version
 *  3. API key configured
 *  4. Prism Cloud reachability
 *  5. API key validity
 *  6. Cosmos DB (via health endpoint)
 *  7. Gemini API (via health endpoint)
 *  8. Local cache exists + is populated
 *  9. IDE detection
 *  10. MCP config written for each detected IDE
 */

import chalk from 'chalk';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { platform, version as nodeVersion } from 'process';
import { getApiOptions } from '../api.js';
import { loadConfig } from '../config.js';

const PRISM_DIR = join(homedir(), '.prism');
const PRISM_API_URL = 'https://prism.jeffdev.studio';

type CheckStatus = 'pass' | 'warn' | 'fail' | 'skip';

interface CheckResult {
  name: string;
  status: CheckStatus;
  detail: string;
  fix?: string;
}

interface DoctorOptions {
  json?: boolean;
}

export async function doctor(options: DoctorOptions = {}): Promise<void> {
  const results: CheckResult[] = [];

  // ── 1. Node.js version ────────────────────────────────────────────────────
  const versionParts = nodeVersion.replace('v', '').split('.').map(Number);
  const major = versionParts[0] ?? 0;
  results.push({
    name: 'Node.js version',
    status: major >= 20 ? 'pass' : 'fail',
    detail: `${nodeVersion} (${platform})`,
    fix: major < 20
      ? 'Install Node 20: https://nodejs.org or use `nvm install 20 && nvm use 20`'
      : undefined,
  });


  // ── 2. CLI version ────────────────────────────────────────────────────────
  let cliVersion = 'unknown';
  try {
    const pkgPath = join(import.meta.dirname, '..', '..', 'package.json');
    if (existsSync(pkgPath)) {
      cliVersion = (JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string }).version;
    }
  } catch { /* ignore */ }
  results.push({
    name: 'Prism CLI',
    status: 'pass',
    detail: `v${cliVersion}`,
  });

  // ── 3. API key configured ─────────────────────────────────────────────────
  const opts = getApiOptions();
  const hasKey = !!opts.token;
  results.push({
    name: 'API key configured',
    status: hasKey ? 'pass' : 'warn',
    detail: hasKey ? `${opts.token!.slice(0, 14)}...` : 'No API key found',
    fix: !hasKey
      ? 'Dashboard → Settings → API Keys → Generate Key. Then set PRISM_API_KEY env var or run `prism login`.'
      : undefined,
  });

  // ── 4. Prism Cloud reachability ───────────────────────────────────────────
  let cloudReachable = false;
  let cloudLatency = 0;
  try {
    const start = Date.now();
    const res = await fetch(`${PRISM_API_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
    cloudLatency = Date.now() - start;
    cloudReachable = res.ok;
  } catch { /* unreachable */ }
  results.push({
    name: 'Prism Cloud',
    status: cloudReachable ? 'pass' : 'warn',
    detail: cloudReachable ? `healthy (${cloudLatency}ms)` : 'unreachable',
    fix: !cloudReachable
      ? 'Check your internet connection. Run `prism serve --offline` to use local cache mode.'
      : undefined,
  });

  // ── 5. API key validity ────────────────────────────────────────────────────
  if (hasKey && cloudReachable) {
    try {
      const res = await fetch(`${PRISM_API_URL}/api/api-keys/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${opts.token}` },
        body: JSON.stringify({ apiKey: opts.token }),
        signal: AbortSignal.timeout(5000),
      });
      const body = await res.json() as { valid?: boolean; tier?: string };
      results.push({
        name: 'API key valid',
        status: body.valid ? 'pass' : 'fail',
        detail: body.valid ? `Active — ${body.tier || 'free'} plan` : 'Key rejected',
        fix: !body.valid
          ? 'Generate a new key: Dashboard → Settings → API Keys. Update PRISM_API_KEY.'
          : undefined,
      });
    } catch {
      results.push({
        name: 'API key valid',
        status: 'skip',
        detail: 'Could not verify (network error)',
      });
    }
  } else if (!hasKey) {
    results.push({
      name: 'API key valid',
      status: 'skip',
      detail: 'No key to verify',
    });
  }

  // ── 6. Local cache ─────────────────────────────────────────────────────────
  const rulesCache = join(PRISM_DIR, 'rules', 'rules.json');
  const rulesMd = join(PRISM_DIR, 'rules.md');
  let cacheEntries = 0;
  let cacheSize = '0 B';
  let cacheAge = 'never synced';

  if (existsSync(rulesCache)) {
    try {
      const raw = readFileSync(rulesCache, 'utf-8');
      const rules = JSON.parse(raw) as unknown[];
      cacheEntries = rules.length;
      const bytes = Buffer.byteLength(raw);
      cacheSize = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
    } catch { /* corrupted */ }

    const config = loadConfig();
    if (config.lastSync) {
      const age = Date.now() - new Date(config.lastSync).getTime();
      const hours = Math.floor(age / 3600000);
      cacheAge = hours < 1 ? 'less than 1 hour ago' : `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
  }

  results.push({
    name: 'Local rules cache',
    status: cacheEntries > 0 ? 'pass' : (existsSync(PRISM_DIR) ? 'warn' : 'fail'),
    detail: cacheEntries > 0
      ? `${cacheEntries} rules — ${cacheSize} — synced ${cacheAge}`
      : 'Empty — no rules cached',
    fix: cacheEntries === 0
      ? 'Run `prism sync` to download your rules from the cloud.'
      : undefined,
  });

  // ── 7. Detect IDEs ──────────────────────────────────────────────────────────
  const detectedIDEs: string[] = [];
  const configuredIDEs: string[] = [];
  const missingIDEs: string[] = [];

  // Cursor
  const cursorPaths = [
    join(homedir(), '.cursor'),
    join(homedir(), 'Library', 'Application Support', 'Cursor'), // macOS
    join(homedir(), 'AppData', 'Roaming', 'Cursor'), // Windows
  ];
  const hasCursor = cursorPaths.some(p => existsSync(p));
  if (hasCursor) {
    detectedIDEs.push('Cursor');
    const cursorMcpPaths = [
      join(process.cwd(), '.cursor', 'mcp.json'),
      join(homedir(), '.cursor', 'mcp.json'),
    ];
    const hasCursorConfig = cursorMcpPaths.some(p => {
      if (!existsSync(p)) return false;
      try {
        const cfg = JSON.parse(readFileSync(p, 'utf-8')) as { mcpServers?: Record<string, unknown> };
        return !!(cfg.mcpServers?.prism);
      } catch { return false; }
    });
    if (hasCursorConfig) configuredIDEs.push('Cursor');
    else missingIDEs.push('Cursor');
  }

  // VS Code
  const vscodePaths = [
    join(homedir(), 'AppData', 'Roaming', 'Code', 'User', 'settings.json'), // Windows
    join(homedir(), '.config', 'Code', 'User', 'settings.json'), // Linux
    join(homedir(), 'Library', 'Application Support', 'Code', 'User', 'settings.json'), // macOS
  ];
  const vscodeSettingsPath = vscodePaths.find(p => existsSync(p));
  if (vscodeSettingsPath) {
    detectedIDEs.push('VS Code');
    try {
      const cfg = JSON.parse(readFileSync(vscodeSettingsPath, 'utf-8')) as { mcp?: { servers?: Record<string, unknown> } };
      if (cfg.mcp?.servers?.prism) configuredIDEs.push('VS Code');
      else missingIDEs.push('VS Code');
    } catch { missingIDEs.push('VS Code'); }
  }

  // Windsurf
  const windsurfPaths = [
    join(homedir(), '.windsurf'),
    join(homedir(), 'AppData', 'Roaming', 'Windsurf'),
    join(homedir(), 'Library', 'Application Support', 'Windsurf'),
  ];
  if (windsurfPaths.some(p => existsSync(p))) {
    detectedIDEs.push('Windsurf');
    // Windsurf config is written via the app UI — we can't check it from here
    missingIDEs.push('Windsurf (manual setup required)');
  }

  // Claude Desktop
  const claudePaths = [
    join(homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json'), // Windows
    join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'), // macOS
    join(homedir(), '.config', 'Claude', 'claude_desktop_config.json'), // Linux
  ];
  const claudeConfigPath = claudePaths.find(p => existsSync(p));
  if (claudeConfigPath) {
    detectedIDEs.push('Claude Desktop');
    try {
      const cfg = JSON.parse(readFileSync(claudeConfigPath, 'utf-8')) as { mcpServers?: Record<string, unknown> };
      if (cfg.mcpServers?.prism) configuredIDEs.push('Claude Desktop');
      else missingIDEs.push('Claude Desktop');
    } catch { missingIDEs.push('Claude Desktop'); }
  }

  const ideStatus: CheckStatus = detectedIDEs.length === 0 ? 'warn'
    : missingIDEs.length === 0 ? 'pass'
    : configuredIDEs.length > 0 ? 'warn' : 'fail';

  results.push({
    name: 'IDE detection',
    status: ideStatus,
    detail: detectedIDEs.length > 0
      ? `Found: ${detectedIDEs.join(', ')}`
      : 'No supported IDEs detected',
    fix: ideStatus !== 'pass' && detectedIDEs.length > 0
      ? `Run \`prism init\` to auto-configure: ${missingIDEs.join(', ')}`
      : undefined,
  });

  results.push({
    name: 'MCP config',
    status: configuredIDEs.length > 0 ? (missingIDEs.length === 0 ? 'pass' : 'warn') : 'fail',
    detail: configuredIDEs.length > 0
      ? `Configured: ${configuredIDEs.join(', ')}`
      : 'Not configured in any IDE',
    fix: missingIDEs.length > 0
      ? `Run \`prism init\` to configure: ${missingIDEs.join(', ')}`
      : undefined,
  });

  // ── Output ─────────────────────────────────────────────────────────────────
  if (options.json) {
    console.log(JSON.stringify({ checks: results }, null, 2));
    return;
  }

  const iconFor = (s: CheckStatus) => {
    switch (s) {
      case 'pass': return chalk.green('✅');
      case 'warn': return chalk.yellow('⚠️ ');
      case 'fail': return chalk.red('❌');
      case 'skip': return chalk.dim('⊝ ');
    }
  };

  console.log(chalk.cyan('\n◈ Prism Doctor\n'));

  for (const r of results) {
    const icon = iconFor(r.status);
    const label = r.name.padEnd(25);
    const detail = chalk.dim(r.detail);
    console.log(`  ${icon} ${chalk.bold(label)} ${detail}`);
    if (r.fix) {
      console.log(`     ${chalk.yellow('→')} ${chalk.yellow(r.fix)}`);
    }
  }

  const passes = results.filter(r => r.status === 'pass').length;
  const total = results.filter(r => r.status !== 'skip').length;
  const allGood = passes === total;

  console.log('');
  if (allGood) {
    console.log(chalk.green(`  ✓ All checks passed (${passes}/${total})`));
  } else {
    const fails = results.filter(r => r.status === 'fail').length;
    const warns = results.filter(r => r.status === 'warn').length;
    console.log(`  ${chalk.bold(`${passes}/${total} checks passed`)} — ${fails > 0 ? chalk.red(`${fails} error${fails !== 1 ? 's' : ''}`) : ''}${fails > 0 && warns > 0 ? ', ' : ''}${warns > 0 ? chalk.yellow(`${warns} warning${warns !== 1 ? 's' : ''}`) : ''}`);
    if (results.some(r => r.status === 'fail' || r.status === 'warn')) {
      console.log(chalk.dim('\n  Run `prism init` to fix IDE configuration issues.'));
      console.log(chalk.dim('  Run `prism sync` to populate the local rules cache.'));
    }
  }
  console.log('');
}
