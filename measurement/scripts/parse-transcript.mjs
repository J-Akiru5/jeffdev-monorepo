/**
 * parse-transcript.mjs — read a Claude Code session JSONL transcript and
 * sum real token usage per the fields the API actually wrote.
 *
 * Line types:
 *   - type: "assistant"  → message.usage { input_tokens, output_tokens,
 *     cache_creation_input_tokens, cache_read_input_tokens }
 *   - type: "user"       → one real user round-trip (message.role === "user")
 *
 * No estimation: every number below comes from a field in the file.
 * Usage: node parse-transcript.mjs <file.jsonl> [--json]
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function textOf(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((block) => (typeof block?.text === "string" ? block.text : ""))
      .join(" ");
  }
  return "";
}

export function parseTranscript(filePath) {
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);

  let sessionId = null;
  const tokens = {
    input: 0,
    output: 0,
    cacheWrite: 0,
    cacheRead: 0,
  };
  let assistantMessages = 0;
  const userTurns = [];
  let firstUserPrompt = null;

  for (const line of lines) {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (typeof entry?.sessionId === "string" && !sessionId) {
      sessionId = entry.sessionId;
    }
    if (entry?.type === "assistant" && entry?.message?.usage) {
      const u = entry.message.usage;
      tokens.input += Number(u.input_tokens) || 0;
      tokens.output += Number(u.output_tokens) || 0;
      tokens.cacheWrite += Number(u.cache_creation_input_tokens) || 0;
      tokens.cacheRead += Number(u.cache_read_input_tokens) || 0;
      assistantMessages++;
    }
    if (
      entry?.type === "user" &&
      entry?.message?.role === "user" &&
      !entry?.isMeta
    ) {
      const text = textOf(entry.message.content).trim();
      if (text.length > 0) {
        userTurns.push({ uuid: entry.uuid ?? null, text: text.slice(0, 160) });
      }
    }
    if (firstUserPrompt === null && userTurns.length > 0) {
      firstUserPrompt = userTurns[0].text;
    }
  }

  const total =
    tokens.input + tokens.output + tokens.cacheWrite + tokens.cacheRead;

  return {
    file: filePath,
    sessionId,
    tokens,
    total,
    userTurns: userTurns.length,
    assistantMessages,
    firstUserPrompt,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const file = process.argv[2];
  if (!file) {
    console.error("usage: node parse-transcript.mjs <file.jsonl> [--json]");
    process.exit(2);
  }
  const result = parseTranscript(file);
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`session:     ${result.sessionId ?? "?"}`);
    console.log(`file:        ${result.file}`);
    console.log(`input:       ${result.tokens.input}`);
    console.log(`output:      ${result.tokens.output}`);
    console.log(`cache_write: ${result.tokens.cacheWrite}`);
    console.log(`cache_read:  ${result.tokens.cacheRead}`);
    console.log(`total:       ${result.total}`);
    console.log(`user turns:  ${result.userTurns}`);
    console.log(`assistant:   ${result.assistantMessages}`);
    console.log(`first prompt: ${result.firstUserPrompt ?? "?"}`);
  }
}