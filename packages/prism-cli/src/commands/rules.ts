import chalk from "chalk";
import ora from "ora";
import { apiFetch } from "../api.js";
import { createInterface } from "readline";

interface RulesOptions {
  json?: boolean;
  category?: string;
  project?: string;
}

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((r) => {
    rl.question(question, (a) => {
      rl.close();
      r(a.trim());
    });
  });
}

export async function listRules(options: RulesOptions) {
  const params = new URLSearchParams();
  if (options.category) params.set("category", options.category);

  const result = await apiFetch<Array<Record<string, unknown>>>(
    `/api/v1/rules?${params}`,
  );
  if (result.error) {
    console.error(chalk.red(`Error: ${result.error}`));
    process.exit(1);
  }

  const items = result.data || [];
  if (options.json) {
    console.log(JSON.stringify(items, null, 2));
    return;
  }
  if (items.length === 0) {
    console.log(chalk.yellow("No rules found."));
    return;
  }

  console.log(chalk.cyan(`\nRules (${items.length}):\n`));
  const byCategory: Record<string, Array<Record<string, unknown>>> = {};
  for (const r of items) {
    const cat = (r.category as string) || "other";
    (byCategory[cat] ??= []).push(r);
  }

  for (const [cat, catRules] of Object.entries(byCategory)) {
    console.log(chalk.bold(`  ${cat}`));
    for (const r of catRules) {
      console.log(chalk.dim(`    • ${r.name}  [priority: ${r.priority}]`));
    }
    console.log("");
  }
}

export async function createRule(options: {
  json?: boolean;
  project?: string;
  name?: string;
  category?: string;
  content?: string;
  priority?: number;
}) {
  if (!options.json) {
    if (!options.name) options.name = await prompt("Rule name: ");
    if (!options.category) {
      console.log(
        "Categories: architecture | styling | security | performance | testing | documentation | custom",
      );
      options.category = await prompt("Category: ");
    }
    if (!options.content) options.content = await prompt("Content: ");

    if (!options.project) {
      const projectSlug = await prompt(
        "Project slug (optional, press enter to skip): ",
      );
      if (projectSlug) options.project = projectSlug;
    }
  }

  if (!options.name || !options.category || !options.content) {
    console.error(
      chalk.red("Missing required fields: name, category, content"),
    );
    process.exit(1);
  }

  let projectId: string | undefined;
  if (options.project) {
    const projects =
      await apiFetch<Array<{ id: string; slug: string }>>("/api/v1/projects");
    const project = (projects.data || []).find(
      (p) => p.slug === options.project || p.id === options.project,
    );
    projectId = project?.id;
  }

  const spinner = ora("Creating rule...").start();
  const body: Record<string, unknown> = {
    name: options.name,
    category: options.category,
    content: options.content,
    priority: options.priority ?? 50,
  };
  if (projectId) body.projectId = projectId;

  const result = await apiFetch("/api/v1/rules", { method: "POST", body });
  if (result.error) {
    spinner.fail(result.error);
    process.exit(1);
  }
  spinner.succeed("Rule created");

  const data = result.data as Record<string, unknown>;
  if (options.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  console.log(`  ${chalk.bold(data.name)} [${data.category}]`);
}

export async function editRule(
  id: string,
  options: {
    json?: boolean;
    content?: string;
    name?: string;
    category?: string;
  },
) {
  const body: Record<string, unknown> = {};
  if (options.content) body.content = options.content;
  if (options.name) body.name = options.name;
  if (options.category) body.category = options.category;

  if (Object.keys(body).length === 0) {
    if (!options.json) {
      options.content = await prompt("New content: ");
      body.content = options.content;
    }
  }

  if (Object.keys(body).length === 0) {
    console.error(chalk.red("No fields to update."));
    process.exit(1);
  }

  const spinner = ora("Updating rule...").start();
  const result = await apiFetch(`/api/v1/rules/${id}`, {
    method: "PATCH",
    body,
  });
  if (result.error) {
    spinner.fail(result.error);
    process.exit(1);
  }
  spinner.succeed("Rule updated");

  if (options.json) {
    console.log(JSON.stringify(result.data, null, 2));
    return;
  }
}

export async function deleteRule(
  id: string,
  options: { json?: boolean; force?: boolean },
) {
  if (!options.force && !options.json) {
    const answer = await prompt(chalk.red(`Delete rule "${id}"? (y/N): `));
    if (answer.toLowerCase() !== "y") {
      console.log("Cancelled.");
      return;
    }
  }

  const spinner = ora("Deleting rule...").start();
  const result = await apiFetch(`/api/v1/rules/${id}`, { method: "DELETE" });
  if (result.error) {
    spinner.fail(result.error);
    process.exit(1);
  }
  spinner.succeed("Rule deleted");
  if (options.json) console.log(JSON.stringify({ deleted: true }, null, 2));
}
