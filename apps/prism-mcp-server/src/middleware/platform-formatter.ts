import { getClientPlatform, type ClientPlatform } from "./client-detector.js";

export interface PlatformConfig {
  /** Preferred response format: markdown or json */
  defaultFormat: "markdown" | "json";
  /** Whether to include rule metadata (priority, tags) */
  includeMetadata: boolean;
  /** Whether to include skill references */
  includeSkills: boolean;
  /** Max tokens for responses (undefined = use caller's value) */
  maxTokens?: number;
  /** Response style suffix */
  styleNote: string;
}

const PLATFORM_CONFIGS: Record<ClientPlatform, PlatformConfig> = {
  cursor: {
    defaultFormat: "json",
    includeMetadata: false,
    includeSkills: false,
    maxTokens: 2000,
    styleNote: "Cursor prefers compact JSON responses with minimal metadata.",
  },
  windsurf: {
    defaultFormat: "markdown",
    includeMetadata: true,
    includeSkills: true,
    styleNote: "Windsurf handles markdown with code fences well.",
  },
  "claude-desktop": {
    defaultFormat: "markdown",
    includeMetadata: false,
    includeSkills: false,
    maxTokens: 1500,
    styleNote: "Claude Desktop prefers minimal format with just the rules.",
  },
  cline: {
    defaultFormat: "json",
    includeMetadata: true,
    includeSkills: true,
    styleNote: "Cline prefers structured JSON for tool processing.",
  },
  "github-copilot": {
    defaultFormat: "markdown",
    includeMetadata: false,
    includeSkills: false,
    maxTokens: 1000,
    styleNote: "GitHub Copilot needs compact responses within token budget.",
  },
  vscode: {
    defaultFormat: "markdown",
    includeMetadata: true,
    includeSkills: true,
    styleNote: "VSCode extension supports full markdown with rich formatting.",
  },
  unknown: {
    defaultFormat: "markdown",
    includeMetadata: true,
    includeSkills: true,
    styleNote: "",
  },
};

let _overriddenPlatform: ClientPlatform | null = null;

export function overridePlatform(platform: ClientPlatform | null): void {
  _overriddenPlatform = platform;
}

export function getConfig(): PlatformConfig {
  const platform = _overriddenPlatform || getClientPlatform();
  return PLATFORM_CONFIGS[platform] || PLATFORM_CONFIGS.unknown;
}

export function resolveFormat(
  requestedFormat?: "markdown" | "json",
): "markdown" | "json" {
  const config = getConfig();
  if (requestedFormat) return requestedFormat;
  return config.defaultFormat;
}

export function resolveMaxTokens(requestedMaxTokens: number): number {
  const config = getConfig();
  if (config.maxTokens !== undefined) {
    return Math.min(requestedMaxTokens, config.maxTokens);
  }
  return requestedMaxTokens;
}

export function getFormatInstructions(): string {
  const config = getConfig();
  const notes: string[] = [];
  if (config.styleNote) notes.push(config.styleNote);
  if (!config.includeMetadata)
    notes.push("Omit rule priority and tag metadata.");
  if (!config.includeSkills) notes.push("Omit skill references.");
  return notes.join(" ");
}
