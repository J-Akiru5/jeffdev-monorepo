import chalk from 'chalk';
import ora from 'ora';
import { apiFetch } from '../api.js';

interface MarketplaceOptions {
  json?: boolean;
  search?: string;
}

export async function listMarketplace(options: MarketplaceOptions) {
  const params = new URLSearchParams();
  if (options.search) params.set('q', options.search);

  const result = await apiFetch<Array<Record<string, unknown>>>(`/api/v1/marketplace?${params}`);
  if (result.error) { console.error(chalk.red(`Error: ${result.error}`)); process.exit(1); }

  const items = result.data || [];
  if (options.json) { console.log(JSON.stringify(items, null, 2)); return; }
  if (items.length === 0) { console.log(chalk.yellow('No marketplace rule sets found.')); return; }

  console.log(chalk.cyan(`\nMarketplace (${items.length}):\n`));
  for (const rs of items) {
    console.log(`  ${chalk.bold(rs.name)}  [${chalk.dim(`${rs.ruleCount} rules`)}]`);
    if (rs.description) console.log(`    ${chalk.dim(rs.description)}`);
  }
  console.log('');
}

export async function installMarketplace(id: string, options: { json?: boolean }) {
  const spinner = ora('Installing rule set...').start();
  const result = await apiFetch(`/api/v1/marketplace/install/${id}`, { method: 'POST' });
  if (result.error) { spinner.fail(result.error); process.exit(1); }
  spinner.succeed('Rule set installed');

  const data = result.data as Record<string, unknown>;
  if (options.json) { console.log(JSON.stringify(data, null, 2)); return; }
  console.log(`  ${chalk.bold(data.ruleSetName)}: ${data.installed} of ${data.totalRules} rules installed`);
}
