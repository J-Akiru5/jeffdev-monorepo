/**
 * Sync Command
 * 
 * Syncs rules from Prism Cloud to local cache
 */

import ora from 'ora';
import chalk from 'chalk';
import { loadConfig, saveConfig, isAuthenticated } from '../config.js';
import { join } from 'path';
import { homedir } from 'os';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

const RULES_CACHE = join(homedir(), '.prism', 'rules');

export async function sync(): Promise<void> {
  if (!isAuthenticated()) {
    console.log(chalk.red('❌ Not authenticated. Run `prism login` first.'));
    process.exit(1);
  }
  
  const config = loadConfig();
  const spinner = ora('Syncing rules from Prism Cloud...').start();
  
  try {
    const response = await fetch(`${config.apiUrl}/api/rules`, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const rules = await response.json();
    
    // Ensure cache directory exists
    if (!existsSync(RULES_CACHE)) {
      mkdirSync(RULES_CACHE, { recursive: true });
    }
    
    // Write rules to cache
    writeFileSync(
      join(RULES_CACHE, 'rules.json'),
      JSON.stringify(rules, null, 2)
    );
    
    // Update last sync time
    saveConfig({ lastSync: new Date().toISOString() });
    
    spinner.succeed(`Synced ${rules.length || 0} rules`);
    console.log(chalk.dim(`   Cache: ${RULES_CACHE}`));
    
  } catch (error) {
    spinner.fail('Sync failed');
    console.log(chalk.red(`   ${(error as Error).message}`));
    process.exit(1);
  }
}
