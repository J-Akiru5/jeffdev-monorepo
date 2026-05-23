import chalk from 'chalk';
import ora from 'ora';
import { apiFetch } from '../api.js';
import { createInterface } from 'readline';

interface ApiKeysOptions {
  json?: boolean;
}

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(r => { rl.question(question, a => { rl.close(); r(a.trim()); }); });
}

export async function listApiKeys(options: ApiKeysOptions) {
  const result = await apiFetch<{ keys: Array<Record<string, unknown>>; limit: number; canCreate: boolean }>('/api/v1/api-keys');
  if (result.error) { console.error(chalk.red(`Error: ${result.error}`)); process.exit(1); }

  const data = result.data!;
  if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }

  if (data.keys.length === 0) {
    console.log(chalk.yellow('No API keys.'));
    if (data.canCreate) console.log(`  Run ${chalk.bold('prism api-keys create')} to generate one.`);
    return;
  }

  console.log(chalk.cyan(`\nAPI Keys (${data.keys.length}):\n`));
  for (const k of data.keys) {
    console.log(`  ${chalk.bold(k.name)}  [${chalk.dim(k.keyPrefix)}...]`);
    console.log(`    ID: ${k.id}  Created: ${(k.createdAt as string)?.slice(0, 10)}`);
  }
  console.log('');
}

export async function createApiKey(options: ApiKeysOptions) {
  let name = '';
  if (!options.json) {
    name = await prompt('Key name (e.g. "CLI"): ');
  }

  if (!name) { console.error(chalk.red('Name is required.')); process.exit(1); }

  const spinner = ora('Generating API key...').start();
  const result = await apiFetch('/api/v1/api-keys', { method: 'POST', body: { name } });
  if (result.error) { spinner.fail(result.error); process.exit(1); }
  spinner.succeed('API key generated');

  const data = result.data as Record<string, unknown>;
  if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }

  console.log(chalk.cyan(`\nAPI Key (copy now - won't be shown again!):\n`));
  console.log(`  ${chalk.green(data.key)}\n`);
  console.log(chalk.yellow(`  Set as env: PRISM_TOKEN=${data.key}`));
}

export async function revokeApiKey(id: string, options: { json?: boolean; force?: boolean }) {
  if (!options.force && !options.json) {
    const answer = await prompt(chalk.red(`Revoke API key "${id}"? (y/N): `));
    if (answer.toLowerCase() !== 'y') { console.log('Cancelled.'); return; }
  }

  const spinner = ora('Revoking API key...').start();
  const result = await apiFetch(`/api/v1/api-keys/${id}`, { method: 'DELETE' });
  if (result.error) { spinner.fail(result.error); process.exit(1); }
  spinner.succeed('API key revoked');
  if (options.json) console.log(JSON.stringify({ revoked: true }, null, 2));
}
