import { createInterface } from "readline";

/**
 * Prompt for a line of text with a default the user can accept by pressing
 * Enter. Shared by `prism init` and `prism pull` so every interactive
 * prompt in the local/synced onboarding paths behaves the same way.
 */
export function promptText(
  question: string,
  defaultValue = "",
): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const suffix = defaultValue ? ` (${defaultValue}) ` : " ";
  return new Promise((resolve) => {
    rl.question(`${question}${suffix}`, (answer) => {
      rl.close();
      const trimmed = answer.trim();
      resolve(trimmed.length > 0 ? trimmed : defaultValue);
    });
  });
}

/**
 * Prompt for a yes/no answer with a default the user can accept by pressing
 * Enter.
 */
export function promptYesNo(
  question: string,
  defaultYes = true,
): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const hint = defaultYes ? "Y/n" : "y/N";
  return new Promise((resolve) => {
    rl.question(`${question} (${hint}) `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      if (normalized === "") {
        resolve(defaultYes);
        return;
      }
      resolve(normalized === "y" || normalized === "yes");
    });
  });
}
