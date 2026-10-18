import { defineConfig } from "vitest/config";
import { existsSync, readFileSync } from "fs";
import path from "path";

// Vitest runs in plain Node — Next only auto-loads .env files for the app.
// Load local env (and the generated E2E creds) so DB integration tests can
// run locally; in CI the variables come from the job environment.
function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf-8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.resolve(__dirname, ".env.local"));
loadEnvFile(path.resolve(__dirname, ".env.e2e.local"));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["node_modules", ".next", "e2e"],
    setupFiles: [],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "text"],
      exclude: [
        "src/types/**",
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/__tests__/**",
      ],
      // Ratchet floor (H4): slightly below the current baseline so the
      // number can only go up. Raise these as coverage improves.
      thresholds: {
        statements: 75,
        branches: 60,
        functions: 70,
        lines: 78,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
