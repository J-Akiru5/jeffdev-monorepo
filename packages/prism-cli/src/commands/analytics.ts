import chalk from 'chalk';
import { apiFetch } from '../api.js';

interface AnalyticsOptions {
  json?: boolean;
}

function bar(value: number, limit: number | string): string {
  if (limit === 'unlimited' || limit === -1) return '∞';
  const max = typeof limit === 'number' ? limit : parseInt(limit) || 100;
  if (max === 0) return '—';
  const pct = Math.min(1, value / max);
  const width = 20;
  const filled = Math.round(pct * width);
  return `${'█'.repeat(filled)}${'░'.repeat(width - filled)} ${value}/${max}`;
}

export async function analytics(options: AnalyticsOptions) {
  const result = await apiFetch<{ tier: string; usage: Record<string, { used: number; limit: number | string }>; resetDate: string }>('/api/v1/analytics');
  if (result.error) { console.error(chalk.red(`Error: ${result.error}`)); process.exit(1); }

  const data = result.data!;
  if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }

  console.log(chalk.cyan(`\n◈ Usage & Limits  [${chalk.bold(data.tier.toUpperCase())} Plan]\n`));

  const usage = data.usage;
  for (const [key, val] of Object.entries(usage)) {
    const label = key === 'aiGenerations' ? 'AI Generations' : key.charAt(0).toUpperCase() + key.slice(1);
    console.log(`  ${chalk.bold(label.padEnd(16))} ${bar(val.used, val.limit)}`);
  }

  if (data.resetDate) {
    console.log(chalk.dim(`\n  Resets: ${data.resetDate.slice(0, 10)}`));
  }
  console.log('');
}
