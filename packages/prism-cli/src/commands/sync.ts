import ora from "ora";
import chalk from "chalk";
import { loadConfig, saveConfig } from "../config.js";
import { join } from "path";
import { homedir } from "os";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { getApiOptions } from "../api.js";
import { scanRepo, formatScanReport } from "./repo-scanner.js";
import { createInterface } from "readline";

function promptYesNo(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${question} (Y/n) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() !== "n");
    });
  });
}

const DATA_DIR = join(homedir(), ".prism");

function readCached(file: string): unknown | null {
  try {
    if (existsSync(file)) {
      return JSON.parse(readFileSync(file, "utf-8"));
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function sync(options?: {
  full?: boolean;
  repo?: string | boolean;
}): Promise<void> {
  // If --repo flag is provided, run repo scanner instead of cloud sync
  if (options?.repo) {
    const repoPath =
      typeof options.repo === "boolean" ? process.cwd() : options.repo;
    console.log(chalk.cyan(`🔍 Scanning repository: ${repoPath}`));
    const spinner = ora("Analyzing codebase structure...").start();

    try {
      const report = await scanRepo(repoPath);
      spinner.succeed(
        `Scanned ${report.structure.fileCount} files in ${report.structure.dirCount} directories`,
      );

      console.log(formatScanReport(report));

      // Save report locally
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(
        join(DATA_DIR, "repo-scan.json"),
        JSON.stringify(report, null, 2),
      );
      console.log(
        chalk.dim(`\n   Report saved: ${join(DATA_DIR, "repo-scan.json")}`),
      );

      // If authenticated, optionally upload to Prism Cloud for AI rule generation
      const opts = getApiOptions();
      if (opts.token) {
        const upload = await promptYesNo(
          "Generate governance rules from this scan?",
        );
        if (upload) {
          const genSpinner = ora("Generating rules via AI...").start();
          try {
            const res = await fetch(`${opts.apiUrl}/api/v1/rules/extract`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${opts.token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ scan: report }),
            });
            if (res.ok) {
              const result = await res.json();
              genSpinner.succeed(
                `Generated ${result.rulesCreated || 0} rules from repo scan`,
              );
            } else {
              genSpinner.fail(
                "Rule generation failed: " + (await res.text()).slice(0, 100),
              );
            }
          } catch (e) {
            genSpinner.fail("Could not reach Prism Cloud for AI generation");
            console.log(
              chalk.dim("   Run without --repo or check your connection."),
            );
          }
        }
      }
    } catch (error) {
      spinner.fail("Scan failed");
      console.log(chalk.red(`   ${(error as Error).message}`));
      process.exit(1);
    }
    return;
  }

  const opts = getApiOptions();
  if (!opts.token) {
    console.log(chalk.red("Not authenticated. Run `prism login` first."));
    process.exit(1);
  }

  const config = loadConfig();
  const lastSyncedAt = config.lastSync;
  const useDelta = !options?.full && !!lastSyncedAt;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${opts.token}`,
    "Content-Type": "application/json",
  };

  const spinner = ora(
    useDelta
      ? "Delta syncing data from Prism Cloud..."
      : "Syncing data from Prism Cloud...",
  ).start();

  try {
    let synced = { rules: 0, projects: 0, brands: 0, components: 0 };

    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

    // Sync rules with delta if available
    const syncRules = async (res: Response) => {
      const rules = await res.json();
      if (useDelta && rules.data?.length === 0) {
        spinner.text = "No new rules since last sync";
      } else {
        const ruleList: Array<{
          id?: string;
          name?: string;
          content?: string;
          category?: string;
          priority?: number;
          tags?: string[];
          pattern?: string;
          severity?: string;
          isActive?: boolean;
          skillsContent?: string;
        }> = Array.isArray(rules) ? rules : rules.data || [];
        writeFileSync(
          join(DATA_DIR, "rules.json"),
          JSON.stringify(rules, null, 2),
        );
        synced.rules = ruleList.length;
        // Generate rules.md for kitchen + rules/rules.json for serve lite fallback
        try {
          if (ruleList.length > 0) {
            const mdLines = [
              "# Prism Architectural Rules",
              "",
              `Synced: ${new Date().toISOString().slice(0, 10)}`,
              "",
            ];
            for (const r of ruleList) {
              mdLines.push(`## ${r.name || "Untitled"}`, "");
              if (r.category) mdLines.push(`**Category:** ${r.category}  `);
              if (r.priority) mdLines.push(`**Priority:** ${r.priority}  `);
              if (r.tags?.length)
                mdLines.push(`**Tags:** ${r.tags.join(", ")}  `);
              mdLines.push("", r.content || "", "", "---", "");
            }
            writeFileSync(join(DATA_DIR, "rules.md"), mdLines.join("\n"));
            const rulesCacheDir = join(DATA_DIR, "rules");
            if (!existsSync(rulesCacheDir))
              mkdirSync(rulesCacheDir, { recursive: true });
            writeFileSync(
              join(rulesCacheDir, "rules.json"),
              JSON.stringify(ruleList, null, 2),
            );
          }
        } catch {
          /* non-critical */
        }
      }
    };

    try {
      let url = `${opts.apiUrl}/api/v1/rules?limit=100`;
      if (useDelta) url += `&modifiedAfter=${encodeURIComponent(lastSyncedAt)}`;
      const rulesRes = await fetch(url, { headers });
      if (rulesRes.ok) {
        await syncRules(rulesRes);
      } else if (useDelta && rulesRes.status === 400) {
        // modifiedAfter not supported by older server — fall back to full sync
        const fallbackRes = await fetch(
          `${opts.apiUrl}/api/v1/rules?limit=100`,
          { headers },
        );
        if (fallbackRes.ok) await syncRules(fallbackRes);
      }
    } catch {
      /* skip */
    }

    // Sync projects with delta
    try {
      let url = `${opts.apiUrl}/api/v1/projects?limit=50`;
      if (useDelta) url += `&modifiedAfter=${encodeURIComponent(lastSyncedAt)}`;
      const projectsRes = await fetch(url, { headers });
      if (projectsRes.ok) {
        const projects = await projectsRes.json();
        if (!(useDelta && projects.data?.length === 0)) {
          writeFileSync(
            join(DATA_DIR, "projects.json"),
            JSON.stringify(projects, null, 2),
          );
          synced.projects = projects.data?.length || 0;
        }
      }
    } catch {
      /* skip */
    }

    // Sync brands with delta
    try {
      let url = `${opts.apiUrl}/api/v1/brands?limit=50`;
      if (useDelta) url += `&modifiedAfter=${encodeURIComponent(lastSyncedAt)}`;
      const brandsRes = await fetch(url, { headers });
      if (brandsRes.ok) {
        const brands = await brandsRes.json();
        if (!(useDelta && brands.data?.length === 0)) {
          writeFileSync(
            join(DATA_DIR, "brands.json"),
            JSON.stringify(brands, null, 2),
          );
          synced.brands = brands.data?.length || 0;
        }
      }
    } catch {
      /* skip */
    }

    // Sync components with delta
    try {
      let url = `${opts.apiUrl}/api/v1/components?limit=50`;
      if (useDelta) url += `&modifiedAfter=${encodeURIComponent(lastSyncedAt)}`;
      const compRes = await fetch(url, { headers });
      if (compRes.ok) {
        const comps = await compRes.json();
        if (!(useDelta && comps.data?.length === 0)) {
          writeFileSync(
            join(DATA_DIR, "components.json"),
            JSON.stringify(comps, null, 2),
          );
          synced.components = comps.data?.length || 0;
        }
      }
    } catch {
      /* skip */
    }

    saveConfig({ lastSync: new Date().toISOString() });

    const deltaNote = useDelta
      ? ` (delta since ${new Date(lastSyncedAt).toLocaleString()})`
      : "";
    spinner.succeed(
      `Synced: ${synced.rules} rules, ${synced.projects} projects, ${synced.brands} brands, ${synced.components} components${deltaNote}`,
    );
    console.log(chalk.dim(`   Cache: ${DATA_DIR}`));
  } catch (error) {
    spinner.fail("Sync failed");
    console.log(chalk.red(`   ${(error as Error).message}`));
    process.exit(1);
  }
}
