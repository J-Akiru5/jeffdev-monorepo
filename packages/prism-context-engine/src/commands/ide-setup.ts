import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { createInterface } from "readline";

const CONFIG_DIR = join(homedir(), ".prism");
const TOKEN_FILE = join(CONFIG_DIR, "token");

const CURSOR_CONFIG_DIR = join(homedir(), ".cursor");
const CURSOR_MCP_FILE = join(CURSOR_CONFIG_DIR, "mcp.json");

const WINDSURF_CONFIG_DIR = join(homedir(), ".windsurf");
const WINDSURF_MCP_FILE = join(WINDSURF_CONFIG_DIR, "mcp.json");

const VSCODE_USER_DIR =
  process.platform === "win32"
    ? join(process.env.APPDATA || "", "Code", "User")
    : join(homedir(), "Library", "Application Support", "Code", "User");
const VSCODE_SETTINGS_FILE = join(VSCODE_USER_DIR, "settings.json");

const CLAUDE_CONFIG_DIR = join(
  homedir(),
  "Library",
  "Application Support",
  "Claude",
);
const CLAUDE_CONFIG_FILE = join(
  CLAUDE_CONFIG_DIR,
  "claude_desktop_config.json",
);

interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

function loadSavedToken(): string | null {
  try {
    if (existsSync(TOKEN_FILE)) {
      return readFileSync(TOKEN_FILE, "utf-8").trim();
    }
  } catch {
    /* ignore */
  }
  return null;
}

function buildMcpConfig(): McpServerConfig {
  const token = process.env.PRISM_TOKEN || loadSavedToken() || "";
  const config: McpServerConfig = {
    command: "npx",
    args: ["prism-context-engine", "serve"],
  };
  if (token) {
    config.env = { PRISM_TOKEN: token };
  }
  // Pass database URI if available (for direct Cosmos DB connection)
  if (process.env.MONGODB_URI) {
    config.env = { ...config.env, MONGODB_URI: process.env.MONGODB_URI };
  }
  if (process.env.GEMINI_API_KEY) {
    config.env = { ...config.env, GEMINI_API_KEY: process.env.GEMINI_API_KEY };
  }
  return config;
}

async function setupCursor(): Promise<boolean> {
  const dir = CURSOR_CONFIG_DIR;
  const file = CURSOR_MCP_FILE;
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  let mcpConfig: Record<string, unknown> = {};
  if (existsSync(file)) {
    try {
      mcpConfig = JSON.parse(readFileSync(file, "utf-8"));
    } catch {
      /* ignore */
    }
  }
  const mcpServers =
    (mcpConfig.mcpServers as Record<string, McpServerConfig>) || {};
  mcpServers.prism = buildMcpConfig();
  mcpConfig.mcpServers = mcpServers;
  writeFileSync(file, JSON.stringify(mcpConfig, null, 2));
  console.log(`  ✓ Created ${file}`);
  return true;
}

async function setupWindsurf(): Promise<boolean> {
  const dir = WINDSURF_CONFIG_DIR;
  const file = WINDSURF_MCP_FILE;
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  let mcpConfig: Record<string, unknown> = {};
  if (existsSync(file)) {
    try {
      mcpConfig = JSON.parse(readFileSync(file, "utf-8"));
    } catch {
      /* ignore */
    }
  }
  const mcpServers =
    (mcpConfig.mcpServers as Record<string, McpServerConfig>) || {};
  mcpServers.prism = buildMcpConfig();
  mcpConfig.mcpServers = mcpServers;
  writeFileSync(file, JSON.stringify(mcpConfig, null, 2));
  console.log(`  ✓ Created ${file}`);
  return true;
}

async function setupVSCode(): Promise<boolean> {
  const file = VSCODE_SETTINGS_FILE;
  if (!existsSync(file)) {
    console.log("  ⚠ VS Code settings file not found. Skipping.");
    return false;
  }
  let settings: Record<string, unknown> = {};
  try {
    settings = JSON.parse(readFileSync(file, "utf-8"));
  } catch {
    /* ignore */
  }
  settings["prism.token"] = process.env.PRISM_TOKEN || loadSavedToken() || "";
  writeFileSync(file, JSON.stringify(settings, null, 2));
  console.log(`  ✓ Updated ${file}`);
  console.log(
    "  ℹ Install Prism extension from VS Code marketplace for full support.",
  );
  return true;
}

async function setupClaudeDesktop(): Promise<boolean> {
  const dir = CLAUDE_CONFIG_DIR;
  const file = CLAUDE_CONFIG_FILE;
  if (!existsSync(dir)) return false;
  let config: Record<string, unknown> = {};
  if (existsSync(file)) {
    try {
      config = JSON.parse(readFileSync(file, "utf-8"));
    } catch {
      /* ignore */
    }
  }
  const mcpServers =
    (config.mcpServers as Record<string, McpServerConfig>) || {};
  mcpServers.prism = buildMcpConfig();
  config.mcpServers = mcpServers;
  writeFileSync(file, JSON.stringify(config, null, 2));
  console.log(`  ✓ Created ${file}`);
  return true;
}

export async function ideSetup(): Promise<void> {
  console.log("◈ Prism Context Engine — IDE Setup\n");

  const token = process.env.PRISM_TOKEN || loadSavedToken();
  if (!token) {
    console.log("⚠ No authentication token found.");
    console.log("  Run `prism login` first or set PRISM_TOKEN.\n");
    const answer = await prompt("Continue without token? (y/N): ");
    if (answer !== "y") {
      console.log("❌ Setup cancelled. Run `prism login` first.");
      process.exit(1);
    }
  }

  const detected: string[] = [];

  if (existsSync(CURSOR_CONFIG_DIR)) {
    detected.push("Cursor");
  }
  if (existsSync(WINDSURF_CONFIG_DIR)) {
    detected.push("Windsurf");
  }
  if (existsSync(VSCODE_SETTINGS_FILE)) {
    detected.push("VS Code");
  }
  if (existsSync(CLAUDE_CONFIG_DIR)) {
    detected.push("Claude Desktop");
  }

  if (detected.length === 0) {
    console.log("⚠ No supported IDEs detected.");
    console.log("  Supported: Cursor, Windsurf, VS Code, Claude Desktop");
    console.log(
      "\n  You can manually configure your IDE by adding to MCP config:",
    );
    console.log(JSON.stringify(buildMcpConfig(), null, 2));
    return;
  }

  console.log(`Detected: ${detected.join(", ")}\n`);

  for (const ide of detected) {
    const answer = await prompt(`Install Prism for ${ide}? (Y/n): `);
    if (answer === "" || answer === "y" || answer === "yes") {
      switch (ide) {
        case "Cursor":
          await setupCursor();
          break;
        case "Windsurf":
          await setupWindsurf();
          break;
        case "VS Code":
          await setupVSCode();
          break;
        case "Claude Desktop":
          await setupClaudeDesktop();
          break;
      }
    }
  }

  console.log("\n✓ Setup complete! Restart your IDE(s) to activate Prism.");
  console.log(
    "  The full MCP server (prism serve) will start automatically when your IDE connects.",
  );
  console.log("  Run `prism sync` to pre-cache rules for offline use.\n");
}
