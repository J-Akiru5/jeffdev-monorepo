import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env
const envPath = resolve(import.meta.dirname, "..", "..", "..", ".env");
const content = readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of content.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx).trim();
  let val = trimmed.slice(idx + 1).trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  )
    val = val.slice(1, -1);
  env[key] = val;
}

console.log(
  "GEMINI_API_KEY:",
  env.GEMINI_API_KEY ? `SET (${env.GEMINI_API_KEY.length} chars)` : "MISSING",
);
console.log(
  "GEMINI_EMBEDDING_MODEL:",
  env.GEMINI_EMBEDDING_MODEL || "embedding-001 (default)",
);
console.log("GEMINI_MODEL:", env.GEMINI_MODEL || "gemini-3-flash (default)");

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);

// Test embedding
console.log("\n--- Testing embedding ---");
try {
  const embModel = genAI.getGenerativeModel({
    model: env.GEMINI_EMBEDDING_MODEL || "embedding-001",
  });
  const embResult = await embModel.embedContent("test embedding text");
  console.log("EMBED OK:", embResult.embedding.values.length, "dimensions");
} catch (e: unknown) {
  console.error("EMBED FAIL:", e instanceof Error ? e.message : e);
}

// Test chat
console.log("\n--- Testing chat ---");
try {
  const chatModel = genAI.getGenerativeModel({
    model: env.GEMINI_MODEL || "gemini-3-flash",
  });
  const chatResult = await chatModel.generateContent("Say 'hello world'");
  console.log("CHAT OK:", chatResult.response.text().slice(0, 80));
} catch (e: unknown) {
  console.error("CHAT FAIL:", e instanceof Error ? e.message : e);
}
