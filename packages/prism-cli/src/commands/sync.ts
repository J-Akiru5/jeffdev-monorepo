import ora from 'ora';
import chalk from 'chalk';
import { loadConfig, saveConfig } from '../config.js';
import { join } from 'path';
import { homedir } from 'os';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { getApiOptions } from '../api.js';

const DATA_DIR = join(homedir(), '.prism');

export async function sync(): Promise<void> {
  const opts = getApiOptions();
  if (!opts.token) {
    console.log(chalk.red('Not authenticated. Run `prism login` first.'));
    process.exit(1);
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${opts.token}`,
    'Content-Type': 'application/json',
  };

  const spinner = ora('Syncing data from Prism Cloud...').start();

  try {
    let synced = { rules: 0, projects: 0, brands: 0, components: 0 };

    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

    // Sync rules
    try {
      const rulesRes = await fetch(`${opts.apiUrl}/api/v1/rules?limit=100`, { headers });
      if (rulesRes.ok) {
        const rules = await rulesRes.json();
        writeFileSync(join(DATA_DIR, 'rules.json'), JSON.stringify(rules, null, 2));
        synced.rules = rules.data?.length || 0;
      }
    } catch { /* skip */ }

    // Sync projects
    try {
      const projectsRes = await fetch(`${opts.apiUrl}/api/v1/projects?limit=50`, { headers });
      if (projectsRes.ok) {
        const projects = await projectsRes.json();
        writeFileSync(join(DATA_DIR, 'projects.json'), JSON.stringify(projects, null, 2));
        synced.projects = projects.data?.length || 0;
      }
    } catch { /* skip */ }

    // Sync brands
    try {
      const brandsRes = await fetch(`${opts.apiUrl}/api/v1/brands?limit=50`, { headers });
      if (brandsRes.ok) {
        const brands = await brandsRes.json();
        writeFileSync(join(DATA_DIR, 'brands.json'), JSON.stringify(brands, null, 2));
        synced.brands = brands.data?.length || 0;
      }
    } catch { /* skip */ }

    // Sync components
    try {
      const compRes = await fetch(`${opts.apiUrl}/api/v1/components?limit=50`, { headers });
      if (compRes.ok) {
        const comps = await compRes.json();
        writeFileSync(join(DATA_DIR, 'components.json'), JSON.stringify(comps, null, 2));
        synced.components = comps.data?.length || 0;
      }
    } catch { /* skip */ }

    saveConfig({ lastSync: new Date().toISOString() });

    spinner.succeed(`Synced: ${synced.rules} rules, ${synced.projects} projects, ${synced.brands} brands, ${synced.components} components`);
    console.log(chalk.dim(`   Cache: ${DATA_DIR}`));
  } catch (error) {
    spinner.fail('Sync failed');
    console.log(chalk.red(`   ${(error as Error).message}`));
    process.exit(1);
  }
}
