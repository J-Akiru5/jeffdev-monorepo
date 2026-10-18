#!/usr/bin/env node
/**
 * db:push — apply pending Supabase migrations without the CLI's login flow.
 *
 * The Supabase CLI's `db push` currently fails for this account with a 403
 * on its "login role" endpoint. This script builds a direct pooler
 * connection (project URL + database password) and pushes via `--db-url`,
 * which is the path that works.
 *
 * Password resolution order:
 *   1. SUPABASE_DB_URL  (full connection string — used as-is)
 *   2. DATABASE_PASSWORD env var
 *   3. DATABASE_PASSWORD from apps/prism-manage/.env.local
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function parseEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[trimmed.slice(0, eq).trim()] = value;
  }
  return out;
}

const poolerUrlPath = resolve(root, "supabase/.temp/pooler-url");
if (!existsSync(poolerUrlPath)) {
  console.error(
    "supabase/.temp/pooler-url not found — run `supabase link` once, or set SUPABASE_DB_URL.",
  );
  process.exit(1);
}

let dbUrl = process.env.SUPABASE_DB_URL || "";
if (!dbUrl) {
  const envLocal = parseEnvFile(
    resolve(root, "apps/prism-manage/.env.local"),
  );
  const password = process.env.DATABASE_PASSWORD || envLocal.DATABASE_PASSWORD;
  if (!password) {
    console.error(
      "No database password: set SUPABASE_DB_URL or DATABASE_PASSWORD (env or apps/prism-manage/.env.local).",
    );
    process.exit(1);
  }
  const url = new URL(readFileSync(poolerUrlPath, "utf8").trim());
  url.password = password;
  dbUrl = url.toString();
}

const host = new URL(dbUrl).host;
console.log(`Pushing migrations to ${host} ...`);

// Resolve a WORKING Supabase CLI: the workspace devDependency first, then the
// global npm shim (Windows), then PATH. Some installs ship without the
// platform binary — the probes pick the first CLI that actually runs.
const candidates = [
  {
    label: "workspace devDependency",
    probe: "pnpm exec supabase --version",
    run: "pnpm exec supabase",
  },
];
if (process.env.APPDATA) {
  const globalShim = `${process.env.APPDATA}\\npm\\supabase.cmd`;
  candidates.push({
    label: `global CLI (${globalShim})`,
    probe: `"${globalShim}" --version`,
    run: `"${globalShim}"`,
  });
}
candidates.push({ label: "supabase (PATH)", probe: "supabase --version", run: "supabase" });

const cli = candidates.find((c) => {
  try {
    execSync(c.probe, { stdio: "pipe", shell: true });
    return true;
  } catch {
    return false;
  }
});

if (!cli) {
  console.error(
    "No working Supabase CLI found. Install one: `npm i -g supabase` (or fix the workspace devDependency).",
  );
  process.exit(1);
}
console.log(`Using ${cli.label}.`);

// Errors are reported without echoing the connection string.
try {
  execSync(`${cli.run} db push --db-url "${dbUrl}"`, {
    stdio: "inherit",
    cwd: root,
    shell: true,
  });
} catch {
  console.error("db:push failed — see the Supabase CLI output above.");
  process.exit(1);
}
