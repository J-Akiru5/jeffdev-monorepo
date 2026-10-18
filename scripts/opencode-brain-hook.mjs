#!/usr/bin/env node
/**
 * opencode → Company Brain hook (v0)
 * ----------------------------------
 * Posts an agent-session summary to /api/brain/ingest so sessions become
 * first-class memories.
 *
 * Usage:
 *   node scripts/opencode-brain-hook.mjs \
 *     --workspace <workspace-uuid> \
 *     --title "Session: shipped the H5 pagination" \
 *     --file transcript.txt
 *
 *   # or pipe the text in:
 *   Get-Content transcript.txt -Raw | node scripts/opencode-brain-hook.mjs --workspace <uuid> --title "..."
 *
 * Env:
 *   BRAIN_INGEST_URL     default http://localhost:3007
 *   BRAIN_INGEST_SECRET  required (same value as the app's env var)
 *
 * Note: the summary is truncated to 8000 chars server-side — distill long
 * transcripts before posting.
 */
import { existsSync, readFileSync } from "node:fs";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const workspaceId = arg("workspace");
const title = arg("title");
const file = arg("file");
const sourceId = arg("source-id");

if (!workspaceId || !title) {
  console.error(
    "Usage: node scripts/opencode-brain-hook.mjs --workspace <uuid> --title <title> [--file <path>] [--source-id <id>]",
  );
  process.exit(1);
}

const secret = process.env.BRAIN_INGEST_SECRET;
if (!secret) {
  console.error("BRAIN_INGEST_SECRET is not set.");
  process.exit(1);
}

const baseUrl = process.env.BRAIN_INGEST_URL || "http://localhost:3007";

async function readSummary() {
  if (file) {
    if (!existsSync(file)) {
      console.error(`File not found: ${file}`);
      process.exit(1);
    }
    return readFileSync(file, "utf8");
  }
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

const summary = (await readSummary()).trim();
if (!summary) {
  console.error("No summary text provided (use --file or pipe via stdin).");
  process.exit(1);
}

const res = await fetch(`${baseUrl}/api/brain/ingest`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-brain-secret": secret,
  },
  body: JSON.stringify({
    workspaceId,
    title,
    summary,
    ...(sourceId ? { sourceId } : {}),
  }),
});

const body = await res.text();
if (!res.ok) {
  console.error(`Ingest failed (${res.status}): ${body}`);
  process.exit(1);
}
console.log(`Ingested: ${body}`);
