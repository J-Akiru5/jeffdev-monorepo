import chalk from "chalk";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const PRISM_DIR = join(homedir(), ".prism");
const RULES_FILE = join(PRISM_DIR, "rules.md");
const SKILLS_FILE = join(PRISM_DIR, "skills.md");
const HISTORY_FILE = join(PRISM_DIR, "kitchen-history.json");
const TELEMETRY_FILE = join(PRISM_DIR, "telemetry.json");

const TOKEN_ESTIMATE_RATIO = 4;

function countTokens(text: string): number {
  return Math.ceil(text.length / TOKEN_ESTIMATE_RATIO);
}

function ensurePrismDir(): void {
  if (!existsSync(PRISM_DIR)) mkdirSync(PRISM_DIR, { recursive: true });
}

function readOrEmpty(file: string): string {
  try {
    if (existsSync(file)) return readFileSync(file, "utf-8");
  } catch {}
  return "";
}

interface AnalyzeOptions {
  task?: string;
  budget?: number;
  json?: boolean;
}

export async function kitchenAnalyze(options: AnalyzeOptions): Promise<void> {
  const rulesMd = readOrEmpty(RULES_FILE);
  const skillsMd = readOrEmpty(SKILLS_FILE);

  if (!rulesMd && !skillsMd) {
    console.log(
      chalk.yellow(
        "\n  No local rules found. Run `prism connect --url <URL>` first.\n",
      ),
    );
    return;
  }

  const task = options.task || "";
  const budget = options.budget || 4000;

  const ruleSections = rulesMd
    .split(/(?=##|\*\*)/)
    .filter((s) => s.trim().length > 0);
  const skillSections = skillsMd
    .split(/(?=##|\*\*)/)
    .filter((s) => s.trim().length > 0);

  const taskLower = task.toLowerCase();
  const taskWords = taskLower.split(/\s+/).filter(Boolean);

  let relevantRules: string[] = [];
  let relevantSkills: string[] = [];

  if (taskWords.length > 0) {
    for (const section of ruleSections) {
      const sectionLower = section.toLowerCase();
      const matchCount = taskWords.filter((w) =>
        sectionLower.includes(w),
      ).length;
      if (matchCount > 0) relevantRules.push(section);
    }
    for (const section of skillSections) {
      const sectionLower = section.toLowerCase();
      const matchCount = taskWords.filter((w) =>
        sectionLower.includes(w),
      ).length;
      if (matchCount > 0) relevantSkills.push(section);
    }
  } else {
    relevantRules = ruleSections;
    relevantSkills = skillSections;
  }

  const allRelevant = [...relevantRules, ...relevantSkills];
  const totalTokens = allRelevant.reduce((sum, s) => sum + countTokens(s), 0);
  const skippedCount = Math.max(
    0,
    allRelevant.length - Math.floor(budget / 100),
  );

  const summarized: string[] = [];
  const kept: string[] = [];
  let runningBudget = budget;

  for (const section of allRelevant) {
    const tokens = countTokens(section);
    if (tokens <= runningBudget) {
      runningBudget -= tokens;
      kept.push(section);
    } else {
      const summaryTokens = countTokens(section.slice(0, 200));
      if (summaryTokens <= runningBudget) {
        runningBudget -= summaryTokens;
        summarized.push(section.slice(0, 200) + "...");
      } else {
        break;
      }
    }
  }

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          task: task || "(none)",
          totalSections: ruleSections.length + skillSections.length,
          relevantSections: allRelevant.length,
          keptSections: kept.length,
          summarizedSections: summarized.length,
          skippedSections: skippedCount,
          totalTokens,
          keptTokens: budget - runningBudget,
          budget,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(chalk.cyan(`\n◈ Context Kitchen — Analyze\n`));

  if (task) console.log(`  ${chalk.bold("Task:")}      "${task}"`);
  console.log(
    `  ${chalk.bold("Sections:")}  ${ruleSections.length + skillSections.length} total`,
  );
  if (task)
    console.log(
      `  ${chalk.bold("Relevant:")}  ${allRelevant.length} (from keyword match)`,
    );
  console.log(`  ${chalk.bold("Keep:")}      ${kept.length} full sections`);
  if (summarized.length > 0)
    console.log(
      `  ${chalk.bold("Summarize:")} ${summarized.length} sections (truncated to ~50 tokens)`,
    );
  if (skippedCount > 0)
    console.log(
      `  ${chalk.bold("Skipped:")}   ${skippedCount} sections (over token budget)`,
    );
  console.log(
    `  ${chalk.bold("Tokens:")}    ${totalTokens} total, ~${budget - runningBudget} after trim (budget: ${budget})`,
  );
  console.log(
    `  ${chalk.bold("Budget:")}    ${budget < totalTokens ? chalk.yellow(`${budget} (over by ${totalTokens - budget} tokens)`) : chalk.green(`${budget} (within limit)`)}`,
  );
  console.log("");
}

interface PreviewOptions {
  task?: string;
  json?: boolean;
}

export async function kitchenPreview(options: PreviewOptions): Promise<void> {
  const rulesMd = readOrEmpty(RULES_FILE);
  const skillsMd = readOrEmpty(SKILLS_FILE);

  if (!rulesMd && !skillsMd) {
    console.log(chalk.yellow("\n  No local rules found.\n"));
    return;
  }

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          rules: rulesMd,
          skills: skillsMd,
          rulesTokens: countTokens(rulesMd),
          skillsTokens: countTokens(skillsMd),
          totalTokens: countTokens(rulesMd) + countTokens(skillsMd),
        },
        null,
        2,
      ),
    );
    return;
  }

  const task = options.task || "";
  if (task) {
    console.log(
      chalk.cyan(`\n◈ Context Kitchen — Preview (filtered by: "${task}")\n`),
    );
  } else {
    console.log(chalk.cyan(`\n◈ Context Kitchen — Preview\n`));
  }

  if (rulesMd) {
    console.log(chalk.bold("─── Rules ───"));
    console.log("");
    const lines = rulesMd.split("\n");
    if (task) {
      const taskLower = task.toLowerCase();
      const taskWords = taskLower.split(/\s+/).filter(Boolean);
      let inRelevant = false;
      for (const line of lines) {
        const lineLower = line.toLowerCase();
        const isHeader = line.startsWith("#") || line.startsWith("**");
        const isRelevant = taskWords.some((w) => lineLower.includes(w));
        if (isHeader && isRelevant) inRelevant = true;
        else if (isHeader && !isRelevant && inRelevant) inRelevant = false;
        if (inRelevant || (isHeader && isRelevant)) console.log(`  ${line}`);
      }
      if (
        !lines.some((l) => taskWords.some((w) => l.toLowerCase().includes(w)))
      ) {
        console.log(`  ${chalk.dim("(no matching rules — showing all)")}`);
        lines.forEach((l) => console.log(`  ${l}`));
      }
    } else {
      lines.slice(0, 40).forEach((l) => console.log(`  ${l}`));
      if (lines.length > 40)
        console.log(`  ${chalk.dim(`... ${lines.length - 40} more lines`)}`);
    }
    console.log("");
  }

  if (skillsMd) {
    console.log(chalk.bold("─── Skills ───"));
    console.log("");
    skillsMd
      .split("\n")
      .slice(0, 20)
      .forEach((l) => console.log(`  ${l}`));
    console.log("");
  }

  const totalTokens = countTokens(rulesMd) + countTokens(skillsMd);
  console.log(
    chalk.dim(
      `  Total: ~${totalTokens} tokens (${rulesMd.length + skillsMd.length} chars)`,
    ),
  );
  console.log("");
}

interface TrimOptions {
  budget: number;
  json?: boolean;
}

export async function kitchenTrim(options: TrimOptions): Promise<void> {
  const rulesMd = readOrEmpty(RULES_FILE);
  if (!rulesMd) {
    console.log(chalk.yellow("\n  No local rules found.\n"));
    return;
  }

  const budget = options.budget || 2000;
  const sections = rulesMd
    .split(/(?=##|\*\*)/)
    .filter((s) => s.trim().length > 0);
  const tokenCounts = sections.map((s) => ({
    section: s,
    tokens: countTokens(s),
  }));
  tokenCounts.sort((a, b) => a.tokens - b.tokens);

  const kept: string[] = [];
  const removed: string[] = [];
  let running = 0;

  for (const item of tokenCounts) {
    if (running + item.tokens <= budget) {
      kept.push(item.section);
      running += item.tokens;
    } else {
      removed.push(item.section);
    }
  }

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          originalSections: sections.length,
          keptSections: kept.length,
          removedSections: removed.length,
          originalTokens: tokenCounts.reduce((s, i) => s + i.tokens, 0),
          keptTokens: running,
          budget,
          removedTitles: removed
            .map((r) => r.split("\n")[0]?.replace(/[#*]/g, "").trim())
            .filter(Boolean),
        },
        null,
        2,
      ),
    );
    return;
  }

  const originalTokens = tokenCounts.reduce((s, i) => s + i.tokens, 0);
  console.log(chalk.cyan(`\n◈ Context Kitchen — Trim\n`));
  console.log(`  ${chalk.bold("Budget:")}     ${budget} tokens`);
  console.log(
    `  ${chalk.bold("Original:")}   ${sections.length} sections, ~${originalTokens} tokens`,
  );
  console.log(
    `  ${chalk.bold("After:")}      ${kept.length} sections, ~${running} tokens`,
  );
  console.log(`  ${chalk.bold("Removed:")}    ${removed.length} sections`);

  if (removed.length > 0) {
    console.log(chalk.yellow(`\n  Removed sections:`));
    for (const r of removed) {
      const title =
        r.split("\n")[0]?.replace(/[#*]/g, "").trim() || "(untitled)";
      console.log(`    - "${title}" (${countTokens(r)} tokens)`);
    }
  }

  if (running > budget) {
    console.log(
      chalk.red(
        `\n  ⚠ Still over budget by ${running - budget} tokens. Try a smaller budget or reduce rules manually.\n`,
      ),
    );
  } else {
    console.log(chalk.green(`\n  ✅ Fits within budget.\n`));
  }
}

export async function kitchenHistory(options: {
  json?: boolean;
}): Promise<void> {
  const history = readOrEmpty(HISTORY_FILE);
  const sessions: Array<{
    task: string;
    estimatedTokens: number;
    actualTokens?: number;
    reduction: number;
    timestamp: string;
  }> = [];

  try {
    if (history) {
      const parsed = JSON.parse(history);
      if (Array.isArray(parsed)) sessions.push(...parsed);
    }
  } catch {}

  if (sessions.length === 0) {
    console.log(chalk.yellow("\n  No kitchen sessions recorded yet.\n"));
    return;
  }

  const last10 = sessions.slice(-10).reverse();

  if (options.json) {
    console.log(JSON.stringify({ sessions: last10 }, null, 2));
    return;
  }

  console.log(
    chalk.cyan(`\n◈ Context Kitchen — History (last ${last10.length})\n`),
  );

  for (const s of last10) {
    const date = s.timestamp
      ? new Date(s.timestamp).toLocaleString()
      : "unknown";
    const reductionStr =
      s.reduction > 0 ? chalk.green(`-${s.reduction}%`) : chalk.dim("baseline");
    console.log(`  ${chalk.bold(s.task || "(no task)")}`);
    console.log(
      `    ${date}  |  Est: ${s.estimatedTokens} tokens  |  ${reductionStr}`,
    );
    console.log("");
  }

  const avgReduction =
    sessions.reduce((sum, s) => sum + (s.reduction || 0), 0) / sessions.length;
  console.log(
    chalk.dim(
      `  Avg reduction: ${avgReduction.toFixed(1)}% across ${sessions.length} sessions`,
    ),
  );
  console.log("");
}

export async function kitchenOptimize(options: {
  json?: boolean;
}): Promise<void> {
  const telemetry = readOrEmpty(TELEMETRY_FILE);
  const rulesMd = readOrEmpty(RULES_FILE);

  if (!telemetry || !rulesMd) {
    console.log(chalk.yellow("\n  No telemetry or rules data to optimize.\n"));
    return;
  }

  const events: Array<{ toolName: string; timestamp: string }> = [];
  try {
    for (const line of telemetry.split("\n").filter(Boolean)) {
      events.push(JSON.parse(line));
    }
  } catch {}

  const sections = rulesMd
    .split(/(?=##|\*\*)/)
    .filter((s) => s.trim().length > 0);
  const toolCalls = events.filter(
    (e) => e.toolName === "get_architectural_rules",
  ).length;
  const totalEvents = events.length;

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          sectionsBefore: sections.length,
          eventsAnalyzed: totalEvents,
          toolCalls,
          status: sections.length > 0 ? "ready" : "no_rules",
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(chalk.cyan(`\n◈ Context Kitchen — Optimize\n`));
  console.log(
    `  ${chalk.bold("Rules:")}       ${sections.length} sections in ~/.prism/rules.md`,
  );
  console.log(
    `  ${chalk.bold("Telemetry:")}   ${totalEvents} events (${toolCalls} get_architectural_rules calls)`,
  );
  console.log(
    `  ${chalk.bold("Status:")}      ${chalk.green("Ready for optimization")}`,
  );

  if (sections.length > 0) {
    const ranked = sections.map((s) => ({
      section: s,
      tokens: countTokens(s),
      title: s.split("\n")[0]?.replace(/[#*]/g, "").trim() || "(untitled)",
    }));
    ranked.sort((a, b) => a.tokens - b.tokens);

    console.log(chalk.cyan(`\n  Recommended priority changes:`));
    const mid = Math.floor(ranked.length / 2);
    ranked
      .slice(0, mid)
      .forEach((r) =>
        console.log(
          chalk.green(`    ↑ ${r.title} (${r.tokens} tok) — promote`),
        ),
      );
    ranked
      .slice(mid)
      .forEach((r) =>
        console.log(chalk.dim(`    ↓ ${r.title} (${r.tokens} tok) — demote`)),
      );
  }

  console.log(
    `\n  ${chalk.dim("Run `prism kitchen trim --budget 2000` to apply budget-based trimming.")}`,
  );
  console.log("");
}
