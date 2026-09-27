/**
 * Login Command
 *
 * Two modes:
 *   prism login                    — open {apiUrl}/auth/cli in the browser.
 *                                   That page shows a session token; paste it
 *                                   back here (or run the printed command).
 *   prism login --token <token>    — verify the token against
 *                                   GET /api/auth/verify (Bearer), and on
 *                                   success persist it to the global
 *                                   ~/.prism/config.json so `prism pull`,
 *                                   `prism link`, `prism whoami` and friends
 *                                   use it as the session auth path.
 *
 * The token is a Supabase session JWT minted on the dashboard. It is stored
 * in the same global config file the other cloud commands already read
 * (config.ts — schema unchanged).
 */

import ora from "ora";
import chalk from "chalk";
import { loadConfig, saveConfig } from "../config.js";

const DEFAULT_API_URL = "https://prism.syntaxure.dev";

export interface LoginOptions {
  token?: string;
}

function apiUrl(): string {
  return (
    process.env.PRISM_API_URL ||
    loadConfig().apiUrl ||
    DEFAULT_API_URL
  ).replace(/\/$/, "");
}

function openBrowser(url: string): void {
  const { exec } = require("child_process") as typeof import("child_process");
  const platform = process.platform;
  if (platform === "win32") {
    exec(`start ${url}`);
  } else if (platform === "darwin") {
    exec(`open ${url}`);
  } else {
    exec(`xdg-open ${url}`);
  }
}

export async function login(options: LoginOptions = {}): Promise<void> {
  const token = options.token?.trim();
  if (!token) {
    // Browser flow: point the user at the (now real) /auth/cli page.
    const authUrl = `${apiUrl()}/auth/cli`;
    const spinner = ora("Opening browser for authentication...").start();
    try {
      openBrowser(authUrl);
      spinner.succeed("Browser opened");
    } catch {
      spinner.fail("Failed to open browser");
    }
    console.log(chalk.cyan("\nComplete authentication in your browser."));
    console.log(
      chalk.dim("  Copy the token shown on the page, then run:"),
    );
    console.log(chalk.bold(`\n  prism login --token <your-token>\n`));
    return;
  }

  // Token flow: verify first, persist only on success.
  const spinner = ora("Verifying session token...").start();
  try {
    const res = await fetch(`${apiUrl()}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      userId?: string;
      tier?: string;
      error?: string;
    };
    if (!res.ok || !body.success) {
      spinner.fail(
        `Verification failed: ${body.error ?? `HTTP ${res.status}`}`,
      );
      console.log(chalk.yellow("  No credentials were saved."));
      process.exitCode = 1;
      return;
    }
    saveConfig({ token });
    spinner.succeed(
      `Authenticated as ${body.userId} (tier: ${body.tier ?? "free"})`,
    );
    console.log(
      chalk.dim(
        "  Session saved to ~/.prism/config.json. Run `prism link` to connect this directory to a project, or `prism whoami` to confirm.",
      ),
    );
  } catch (err) {
    spinner.fail(`Could not reach Prism Cloud: ${String(err)}`);
    process.exitCode = 1;
  }
}