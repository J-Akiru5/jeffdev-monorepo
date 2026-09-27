/**
 * logout command — clear the saved Prism session.
 *
 * Removes the token from the global ~/.prism/config.json. Does NOT touch
 * PRISM_API_KEY / .prism/config.json apiKey — the API-key path is
 * independent by design and CI flows keep working after a logout.
 */

import chalk from "chalk";
import { loadConfig, saveConfig } from "../config.js";

export function logout(): void {
  const hadToken = Boolean(loadConfig().token);
  saveConfig({ token: undefined });
  if (hadToken) {
    console.log(chalk.green("Logged out. Session token cleared."));
  } else {
    console.log(chalk.yellow("No saved session to clear."));
  }
  console.log(
    chalk.dim(
      "  The API-key path (PRISM_API_KEY / .prism/config.json apiKey) is unaffected.",
    ),
  );
}