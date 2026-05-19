import { loadConfig } from '../config.js';

export interface ApiOptions {
  token: string;
  apiUrl: string;
}

export function getApiOptions(): ApiOptions {
  const config = loadConfig();
  const token = process.env.PRISM_TOKEN || config.token || '';
  const apiUrl = process.env.PRISM_API_URL || config.apiUrl || 'https://prism.jeffdev.studio';
  return { token, apiUrl };
}

export async function apiFetch<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; token?: string; apiUrl?: string } = {}
): Promise<{ data?: T; meta?: Record<string, unknown>; error?: string; status: number }> {
  const opts = getApiOptions();
  const token = options.token || opts.token;
  const apiUrl = options.apiUrl || opts.apiUrl;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${apiUrl}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  return { ...json, status: res.status };
}
