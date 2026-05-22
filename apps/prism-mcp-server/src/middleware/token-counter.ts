import { countTokens } from "gpt-tokenizer";
import { appendFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const PRISM_DIR = join(homedir(), ".prism");
const TELEMETRY_FILE = join(PRISM_DIR, "telemetry.json");

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
  result: ToolResponse
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
    const entry = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    appendFileSync(TELEMETRY_FILE, JSON.stringify(entry) + "\n");
  } catch {
    // silently fail — telemetry logging should never crash the server
  }
}
