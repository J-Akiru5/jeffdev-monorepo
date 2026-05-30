import chalk from "chalk";
import { apiFetch } from "../api.js";

interface TelemetryOptions {
  json?: boolean;
}

export async function telemetry(options: TelemetryOptions) {
  const result = await apiFetch<{
    tier: string;
    usage: Record<string, { used: number; limit: number | string }>;
    telemetry: {
      tokensThisMonth: number;
      totalCalls: number;
      errorCalls: number;
      tokensByTool?: Record<string, number>;
      tokensByProject?: Record<string, number>;
      costEstimate: number;
    };
    resetDate: string;
  }>("/api/v1/analytics");

  if (result.error) {
    console.error(chalk.red(`Error: ${result.error}`));
    process.exit(1);
  }

  const data = result.data!;
  if (options.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const tel = data.telemetry;

  console.log(
    chalk.cyan(
      `\n◈ Token Telemetry  [${chalk.bold(data.tier.toUpperCase())} Plan]\n`,
    ),
  );

  console.log(
    `  ${chalk.bold("Tokens This Month:")}  ${chalk.yellow(tel.tokensThisMonth.toLocaleString())}`,
  );
  console.log(`  ${chalk.bold("Total MCP Calls:")}   ${tel.totalCalls}`);
  if (tel.errorCalls > 0) {
    console.log(
      `  ${chalk.bold("Failed Calls:")}      ${chalk.red(tel.errorCalls)}`,
    );
  }
  console.log(
    `  ${chalk.bold("Est. Cost (USD):")}    $${tel.costEstimate.toFixed(2)}`,
  );

  if (tel.tokensByTool && Object.keys(tel.tokensByTool).length > 0) {
    console.log(chalk.cyan(`\n  Tokens by Tool:`));
    const sorted = Object.entries(tel.tokensByTool).sort(
      ([, a], [, b]) => b - a,
    );
    for (const [tool, tokens] of sorted) {
      const pct =
        tel.tokensThisMonth > 0
          ? ((tokens / tel.tokensThisMonth) * 100).toFixed(1)
          : "0.0";
      console.log(
        `    ${chalk.bold(tool.padEnd(30))} ${tokens.toLocaleString().padStart(10)}  (${pct}%)`,
      );
    }
  }

  if (tel.tokensByProject && Object.keys(tel.tokensByProject).length > 0) {
    console.log(chalk.cyan(`\n  Tokens by Project:`));
    const sorted = Object.entries(tel.tokensByProject).sort(
      ([, a], [, b]) => b - a,
    );
    for (const [project, tokens] of sorted) {
      console.log(
        `    ${chalk.bold(project.padEnd(30))} ${tokens.toLocaleString().padStart(10)}`,
      );
    }
  }

  console.log(
    chalk.dim(`\n  Data since: ${data.resetDate?.slice(0, 10) || "N/A"}`),
  );
  console.log("");
}
