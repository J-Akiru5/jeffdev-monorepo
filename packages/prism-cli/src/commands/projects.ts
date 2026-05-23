import chalk from 'chalk';
import ora from 'ora';
import { apiFetch } from '../api.js';
import { createInterface } from 'readline';

interface ProjectsOptions {
  json?: boolean;
  stack?: string;
  designSystem?: string;
}

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(r => { rl.question(question, a => { rl.close(); r(a.trim()); }); });
}

export async function listProjects(options: ProjectsOptions) {
  const params = new URLSearchParams();
  if (options.stack) params.set('stack', options.stack);
  if (options.designSystem) params.set('designSystem', options.designSystem);

  const result = await apiFetch<Array<Record<string, unknown>>>(`/api/v1/projects?${params}`);
  if (result.error) { console.error(chalk.red(`Error: ${result.error}`)); process.exit(1); }

  const items = result.data || [];
  if (options.json) { console.log(JSON.stringify(items, null, 2)); return; }

  if (items.length === 0) { console.log(chalk.yellow('No projects found.')); return; }

  console.log(chalk.cyan(`\nProjects (${items.length}):\n`));
  for (const p of items) {
    console.log(`  ${chalk.bold(p.name)}  [${chalk.dim(p.stack)} / ${chalk.dim(p.designSystem)}]`);
    console.log(`    ${chalk.dim('slug:')} ${p.slug}  ${chalk.dim('rules:')} ${p.ruleCount}  ${chalk.dim('videos:')} ${p.videoCount}`);
  }
  console.log('');
}

export async function viewProject(slug: string, options: { json?: boolean }) {
  const projects = await apiFetch<Array<{ id: string; slug: string; name: string }>>('/api/v1/projects');
  const project = (projects.data || []).find(p => p.slug === slug || p.id === slug);
  if (!project) { console.error(chalk.red('Project not found.')); process.exit(1); }

  const result = await apiFetch<Record<string, unknown>>(`/api/v1/projects/${project.id}`);
  if (result.error) { console.error(chalk.red(`Error: ${result.error}`)); process.exit(1); }

  const p = result.data!;
  if (options.json) { console.log(JSON.stringify(p, null, 2)); return; }

  console.log(chalk.cyan(`\n${p.name}`));
  console.log(`  Stack:        ${chalk.bold(p.stack)}`);
  console.log(`  Design:       ${chalk.bold(p.designSystem)}`);
  console.log(`  Rules:        ${p.ruleCount}  |  Videos: ${p.videoCount}`);
  console.log(`  Created:      ${(p.createdAt as string)?.slice(0, 10)}`);
  console.log('');

  const rulesRes = await apiFetch<Array<Record<string, unknown>>>(`/api/v1/projects/${project.id}/rules`);
  const rules = rulesRes.data || [];
  if (rules.length > 0) {
    console.log(chalk.bold('  Rules:'));
    for (const r of rules) {
      console.log(`    ${chalk.dim('•')} ${r.name} [${chalk.dim(r.category)}]`);
    }
    console.log('');
  }
}

export async function createProject(options: { json?: boolean; name?: string; design?: string; stack?: string }) {
  let name = options.name;
  let design = options.design;
  let stack = options.stack;

  if (!options.json) {
    if (!name) name = await prompt('Project name: ');
    if (!design) {
      console.log('\nDesign systems: jdstudio | bare-minimum | glassmorphic | 8bit-nostalgia | keandrew | custom');
      design = await prompt('Design system: ');
    }
    if (!stack) {
      console.log('\nStacks: react | nextjs | react-native');
      stack = await prompt('Stack: ');
    }
  }

  if (!name || !design || !stack) {
    console.error(chalk.red('Missing required fields: name, design, stack'));
    process.exit(1);
  }

  const spinner = ora('Creating project...').start();
  const result = await apiFetch('/api/v1/projects', {
    method: 'POST',
    body: { name, designSystem: design, stack },
  });

  if (result.error) { spinner.fail(result.error); process.exit(1); }
  spinner.succeed('Project created');

  const p = result.data as Record<string, unknown>;
  if (options.json) { console.log(JSON.stringify(p, null, 2)); return; }
  console.log(`  ${chalk.bold(p.name)} (${p.slug}) [${p.stack} / ${p.designSystem}]`);
}

export async function deleteProject(slug: string, options: { json?: boolean; force?: boolean }) {
  if (!options.force && !options.json) {
    const answer = await prompt(chalk.red(`Delete project "${slug}"? This cannot be undone. (y/N): `));
    if (answer.toLowerCase() !== 'y') { console.log('Cancelled.'); return; }
  }

  const projects = await apiFetch<Array<{ id: string; slug: string }>>('/api/v1/projects');
  const project = (projects.data || []).find(p => p.slug === slug || p.id === slug);
  if (!project) { console.error(chalk.red('Project not found.')); process.exit(1); }

  const spinner = ora('Deleting project...').start();
  const result = await apiFetch(`/api/v1/projects/${project.id}`, { method: 'DELETE' });
  if (result.error) { spinner.fail(result.error); process.exit(1); }
  spinner.succeed('Project deleted');
  if (options.json) console.log(JSON.stringify({ deleted: true }, null, 2));
}
