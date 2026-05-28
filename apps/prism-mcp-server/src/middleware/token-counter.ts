import { countTokens } from "gpt-tokenizer";
import { appendFileSync, mkdirSync, existsSync, statSync, renameSync, readdirSync, unlinkSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const PRISM_DIR = join(homedir(), ".prism");
const TELEMETRY_FILE = join(PRISM_DIR, "telemetry.json");
const MAX_TELEMETRY_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_ROTATED_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function countTokensInText(text: string): number {
  return countTokens(text);
}

export interface ToolResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
  _meta?: Record<string, unknown>;
}

export interface TokenMeta {
  tokenCount: number;
  byteSize: number;
  toolName?: string;
  timestamp?: string;
}

export function trackToolResponse(
  result: ToolResponse,
): ToolResponse & { _meta: { tokenCount: number; byteSize: number } } {
  const text = result.content.map((c) => c.text).join("\n");
  const tokenCount = countTokensInText(text);
  const byteSize = Buffer.byteLength(text, "utf-8");

  return {
    ...result,
    _meta: {
      ...(result._meta || {}),
      tokenCount,
      byteSize,
    },
  };
}

export function logTelemetryEvent(event: {
  toolName: string;
  tokenCount: number;
  byteSize: number;
  isError: boolean;
  cacheHit?: boolean;
  fromCache?: boolean;
  projectId?: string;
  model?: string;
  clientPlatform?: string;
}): void {
  try {
    if (!existsSync(PRISM_DIR)) {
      mkdirSync(PRISM_DIR, { recursive: true });
    }

    // Rotate telemetry file if it exceeds the size limit
    if (existsSync(TELEMETRY_FILE)) {
      try {
        const stats = statSync(TELEMETRY_FILE);
        if (stats.size > MAX_TELEMETRY_SIZE) {
          const rotated = TELEMETRY_FILE.replace(".json", `.${Date.now()}.json`);
          renameSync(TELEMETRY_FILE, rotated);
        }
      } catch {
        // rotation failure is non-fatal
      }
    }

    // Clean up rotated telemetry files older than 30 days
    try {
      const now = Date.now();
      const files = readdirSync(PRISM_DIR);
      for (const file of files) {
        if (file.startsWith("telemetry.") && file.endsWith(".json") && file !== "telemetry.json") {
          const match = file.match(/telemetry\.(\d+)\.json/);
          if (match?.[1] && now - parseInt(match[1], 10) > MAX_ROTATED_AGE_MS) {
            unlinkSync(join(PRISM_DIR, file));
          }
        }
      }
    } catch {
      // cleanup failure is non-fatal
    }

    const entry = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    appendFileSync(TELEMETRY_FILE, JSON.stringify(entry) + "\n");
  } catch {
    // silently fail — telemetry logging should never crash the server
  }
}
