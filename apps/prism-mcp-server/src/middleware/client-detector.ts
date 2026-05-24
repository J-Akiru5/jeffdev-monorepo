export type ClientPlatform =
  | "vscode"
  | "cursor"
  | "windsurf"
  | "claude-desktop"
  | "cline"
  | "github-copilot"
  | "unknown";

export interface ClientInfo {
  name: string;
  version: string;
  platform: ClientPlatform;
}

const CLIENT_PATTERNS: Array<{ pattern: RegExp; platform: ClientPlatform }> = [
  { pattern: /cursor/i, platform: "cursor" },
  { pattern: /windsurf/i, platform: "windsurf" },
  { pattern: /claude/i, platform: "claude-desktop" },
  { pattern: /cline/i, platform: "cline" },
  {
    pattern: /github copilot|github-copilot|ghcp/i,
    platform: "github-copilot",
  },
  { pattern: /vs.?code|visual studio/i, platform: "vscode" },
];

let _currentClient: ClientInfo = {
  name: "unknown",
  version: "0.0.0",
  platform: "unknown",
};

export function detectPlatform(clientName: string): ClientPlatform {
  for (const { pattern, platform } of CLIENT_PATTERNS) {
    if (pattern.test(clientName)) return platform;
  }
  return "unknown";
}

export function setCurrentClient(clientInfo: {
  name: string;
  version: string;
}): void {
  _currentClient = {
    name: clientInfo.name,
    version: clientInfo.version,
    platform: detectPlatform(clientInfo.name),
  };
}

export function getCurrentClient(): ClientInfo {
  return { ..._currentClient };
}

export function getClientPlatform(): ClientPlatform {
  return _currentClient.platform;
}
