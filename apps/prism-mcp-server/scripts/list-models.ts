import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";
import { resolve } from "path";

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
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
    val = val.slice(1, -1);
  env[key] = val;
}

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);

// List all available models
console.log("Listing available models from generativelanguage.googleapis.com...\n");
try {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEMINI_API_KEY}`
  );
  const data = await resp.json() as { models?: Array<{ name: string; supportedGenerationMethods?: string[] }> };
  if (data.models) {
    for (const m of data.models) {
      const methods = m.supportedGenerationMethods?.join(", ") || "";
      console.log(`  ${m.name}  [${methods}]`);
    }
  } else {
    console.log("Unexpected response:", JSON.stringify(data, null, 2).slice(0, 500));
  }
} catch (e) {
  console.error("List models failed:", e instanceof Error ? e.message : e);
}
