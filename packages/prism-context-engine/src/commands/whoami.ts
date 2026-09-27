/**
 * whoami command — show the authenticated Prism user.
 *
 * Loads the global session token and verifies it against
 * GET /api/auth/verify, printing userId + tier. Non-zero exit when there is
 * no saved session or the token no longer verifies.
 */

import chalk from "chalk";
import { loadConfig } from "../config.js";
import { getApiOptions } from "../api.js";

const DEFAULT_API_URL = "https://prism.syntaxure.dev";

export async function whoami(): Promise<void> {
  const opts = getApiOptions();
  const token = opts.token;
  if (!token) {
    console.error(
      chalk.yellow("Not logged in — run `prism login` (browser) or `prism login --token <token>`."),
    );
    process.exitCode = 1;
    return;
  }

  try {
    const res = await fetch(
      `${opts.apiUrl || DEFAULT_API_URL}/api/auth/verify`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const body = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      userId?: string;
      tier?: string;
      error?: string;
    };
    if (!res.ok || !body.success) {
      console.error(
        chalk.yellow(
          `Session invalid (${body.error ?? `HTTP ${res.status}`}) — run \`prism login --token <token>\` again.`,
        ),
      );
      process.exitCode = 1;
      return;
    }
    console.log(chalk.green("Authenticated"));
    console.log(`  User: ${body.userId}`);
    console.log(`  Tier: ${body.tier ?? "free"}`);
  } catch (err) {
    console.error(chalk.red(`Could not reach Prism Cloud: ${String(err)}`));
    process.exitCode = 1;
  }
}

export function isLoggedIn(): boolean {
  return Boolean(loadConfig().token || process.env.PRISM_TOKEN);
}