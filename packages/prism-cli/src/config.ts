import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const CONFIG_DIR = join(homedir(), ".prism");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export interface PrismConfig {
  token?: string;
  apiUrl?: string;
  lastSync?: string;
}

export function loadConfig(): PrismConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      return JSON.parse(readFileSync(CONFIG_FILE, "utf-8")) as PrismConfig;
    }
  } catch {
    // ignore corrupt config
  }
  return {};
}

export function saveConfig(partial: Partial<PrismConfig>): void {
  const config = { ...loadConfig(), ...partial };
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function isAuthenticated(): boolean {
  return !!(process.env.PRISM_TOKEN || loadConfig().token);
}
