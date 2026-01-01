/**
 * Prism CLI Configuration
 * 
 * Manages local config stored in ~/.prism/config.json
 */

import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

export interface PrismConfig {
  apiUrl: string;
  token: string | null;
  userId: string | null;
  tier: 'free' | 'pro' | 'team' | 'enterprise' | null;
  lastSync: string | null;
}

const CONFIG_DIR = join(homedir(), '.prism');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: PrismConfig = {
  apiUrl: 'https://api.prism.jeffdev.studio',
  token: null,
  userId: null,
  tier: null,
  lastSync: null,
};

export function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): PrismConfig {
  ensureConfigDir();
  
  if (!existsSync(CONFIG_FILE)) {
    saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
  
  try {
    const raw = readFileSync(CONFIG_FILE, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: Partial<PrismConfig>): void {
  ensureConfigDir();
  const current = existsSync(CONFIG_FILE) 
    ? JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) 
    : DEFAULT_CONFIG;
  const updated = { ...current, ...config };
  writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2));
}

export function isAuthenticated(): boolean {
  const config = loadConfig();
  return config.token !== null;
}
