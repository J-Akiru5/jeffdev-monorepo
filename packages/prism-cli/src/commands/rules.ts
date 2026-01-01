/**
 * Rules Command
 * 
 * List cached rules
 */

import chalk from 'chalk';
import { join } from 'path';
import { homedir } from 'os';
import { readFileSync, existsSync } from 'fs';

const RULES_CACHE = join(homedir(), '.prism', 'rules', 'rules.json');

interface RulesOptions {
  category?: string;
}

interface Rule {
  slug: string;
  name?: string;
  category: string;
  content: string;
}

export async function rules(options: RulesOptions): Promise<void> {
  if (!existsSync(RULES_CACHE)) {
    console.log(chalk.yellow('No rules cached. Run `prism sync` first.'));
    return;
  }
  
  try {
    const allRules: Rule[] = JSON.parse(readFileSync(RULES_CACHE, 'utf-8'));
    
    let filtered = allRules;
    if (options.category) {
      filtered = allRules.filter((r) => r.category === options.category);
    }
    
    console.log(chalk.cyan(`\n◈ Prism Rules (${filtered.length} total)\n`));
    
    // Group by category
    const byCategory: Record<string, Array<{ slug: string; name: string }>> = {};
    
    for (const rule of filtered) {
      const cat = rule.category;
      if (!byCategory[cat]) {
        byCategory[cat] = [];
      }
      const arr = byCategory[cat];
      if (arr) {
        arr.push({ slug: rule.slug, name: rule.name || rule.slug });
      }
    }
    
    for (const [category, categoryRules] of Object.entries(byCategory)) {
      console.log(chalk.bold(`  ${category}`));
      for (const rule of categoryRules) {
        console.log(chalk.dim(`    • ${rule.slug}`));
      }
      console.log('');
    }
    
  } catch {
    console.log(chalk.red('Failed to read rules cache.'));
  }
}
