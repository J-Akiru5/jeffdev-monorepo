import chalk from 'chalk';
import ora from 'ora';
import { apiFetch } from '../api.js';

interface GenerateOptions {
  json?: boolean;
  prompt?: string;
  design?: string;
  stack?: string;
  rules?: boolean;
  output?: string;
}

export async function generate(options: GenerateOptions) {
  const prompt = options.prompt;
  const designSystem = options.design || 'jdstudio';
  const stack = options.stack || 'nextjs';
  const generateRules = options.rules || false;

  if (!prompt) {
    console.error(chalk.red('--prompt is required. Usage: prism generate --prompt "a login form"'));
    process.exit(1);
  }

  const spinner = ora('Generating component with AI...').start();

  const result = await apiFetch('/api/generate', {
    method: 'POST',
    body: { prompt, designSystem, stack, generateRules },
  });

  if (result.error) { spinner.fail(result.error); process.exit(1); }

  const data = result.data as Record<string, unknown>;
  spinner.succeed('Component generated');

  const component = data.component as Record<string, unknown> | undefined;
  const rules = data.rules as unknown;

  if (options.json) {
    console.log(JSON.stringify({ component, rules }, null, 2));
    return;
  }

  if (component?.code) {
    console.log(chalk.cyan('\n--- Generated Component ---\n'));
    console.log(component.code);

    if (rules) {
      console.log(chalk.cyan('\n--- Companion Rules ---\n'));
      console.log(typeof rules === 'string' ? rules : JSON.stringify(rules, null, 2));
    }

    if (options.output) {
      const { writeFileSync } = await import('fs');
      writeFileSync(options.output, component.code as string);
      console.log(chalk.dim(`\nSaved to: ${options.output}`));
    }
  }
}
