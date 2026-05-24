import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
} from "fs";
import { join } from "path";
import { homedir } from "os";

const CACHE_DIR = join(homedir(), ".prism", "cache");
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_ENTRIES = 200;

interface CacheEntry<T> {
  key: string;
  data: T;
  createdAt: number;
  expiresAt: number;
  sizeBytes: number;
  hitCount: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const accessOrder: string[] = [];

let cacheHits = 0;
let cacheMisses = 0;

let _cacheDirEnsured = false;

function ensureCacheDir(): void {
  if (_cacheDirEnsured) return;
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
  _cacheDirEnsured = true;
}

function hashKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

function diskPath(key: string): string {
  return join(CACHE_DIR, `${hashKey(key)}.json`);
}

function touchAccess(key: string): void {
  const idx = accessOrder.indexOf(key);
  if (idx >= 0) accessOrder.splice(idx, 1);
  accessOrder.push(key);
}

function evictIfNeeded(): void {
  if (memoryCache.size <= MAX_ENTRIES) return;

  const toEvict = accessOrder.slice(0, Math.ceil(MAX_ENTRIES * 0.2));
  for (const key of toEvict) {
    memoryCache.delete(key);
    const idx = accessOrder.indexOf(key);
    if (idx >= 0) accessOrder.splice(idx, 1);
    try {
      unlinkSync(diskPath(key));
    } catch {
      /* ignore */
    }
  }
}

function enforceSizeLimit(): void {
  let totalBytes = 0;
  const entries: Array<{ key: string; size: number }> = [];

  for (const [key, entry] of memoryCache) {
    totalBytes += entry.sizeBytes;
    entries.push({ key, size: entry.sizeBytes });
  }

  if (totalBytes <= MAX_CACHE_BYTES) return;

  entries.sort((a, b) => {
    const aEntry = memoryCache.get(a.key);
    const bEntry = memoryCache.get(b.key);
    return (aEntry?.hitCount || 0) - (bEntry?.hitCount || 0);
  });

  while (totalBytes > MAX_CACHE_BYTES && entries.length > 0) {
    const victim = entries.shift()!;
    const entry = memoryCache.get(victim.key);
    if (entry) {
      totalBytes -= entry.sizeBytes;
      memoryCache.delete(victim.key);
      const idx = accessOrder.indexOf(victim.key);
      if (idx >= 0) accessOrder.splice(idx, 1);
      try {
        unlinkSync(diskPath(victim.key));
      } catch {
        /* ignore */
      }
    }
  }
}

export function getCacheKey(
  projectId: string | undefined,
  ruleIds: string[],
): string {
  const sorted = [...ruleIds].sort().join(",");
  return `${projectId || "global"}_${sorted}`;
}

export function getCached<T>(key: string): T | null {
  const now = Date.now();

  const mem = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (mem) {
    if (now < mem.expiresAt) {
      mem.hitCount++;
      touchAccess(key);
      cacheHits++;
      return mem.data;
    }
    memoryCache.delete(key);
    const idx = accessOrder.indexOf(key);
    if (idx >= 0) accessOrder.splice(idx, 1);
  }

  try {
    const file = diskPath(key);
    if (existsSync(file)) {
      const raw = readFileSync(file, "utf-8");
      const disk = JSON.parse(raw) as CacheEntry<T>;
      if (now < disk.expiresAt) {
        disk.hitCount = (disk.hitCount || 0) + 1;
        memoryCache.set(key, disk as CacheEntry<unknown>);
        touchAccess(key);
        cacheHits++;
        return disk.data;
      }
      unlinkSync(file);
    }
  } catch {
    /* stale or corrupt file */
  }

  cacheMisses++;
  return null;
}

export function setCached<T>(
  key: string,
  data: T,
  ttlMs: number = DEFAULT_TTL_MS,
): void {
  const serialized = JSON.stringify(data);
  const sizeBytes = Buffer.byteLength(serialized, "utf-8");

  const entry: CacheEntry<T> = {
    key,
    data,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
    sizeBytes,
    hitCount: 0,
  };

  memoryCache.set(key, entry as CacheEntry<unknown>);
  touchAccess(key);

  ensureCacheDir();
  try {
    writeFileSync(diskPath(key), JSON.stringify(entry));
  } catch {
    /* disk write failure — serve from memory */
  }

  evictIfNeeded();
  enforceSizeLimit();
}

/** Clear both memory and disk cache (full purge) */
export function invalidateCache(projectId?: string): void {
  const prefix = projectId ? `${projectId}_` : "";

  for (const key of [...memoryCache.keys()]) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
      const idx = accessOrder.indexOf(key);
      if (idx >= 0) accessOrder.splice(idx, 1);
      try {
        unlinkSync(diskPath(key));
      } catch {
        /* ignore */
      }
    }
  }
}

/** Clear memory cache only (disk entries preserved for reload) */
export function clearMemoryCache(): void {
  memoryCache.clear();
  accessOrder.length = 0;
}

/** Check if a key exists in memory cache */
export function hasInMemory(key: string): boolean {
  return memoryCache.has(key);
}

export function getCacheStats(): {
  hits: number;
  misses: number;
  size: number;
  entries: number;
} {
  return {
    hits: cacheHits,
    misses: cacheMisses,
    size: memoryCache.size,
    entries: memoryCache.size,
  };
}

export function resetCacheStats(): void {
  cacheHits = 0;
  cacheMisses = 0;
}

export function loadDiskCacheIntoMemory(): number {
  ensureCacheDir();
  let loaded = 0;
  try {
    const files = readdirSync(CACHE_DIR).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      try {
        const raw = readFileSync(join(CACHE_DIR, file), "utf-8");
        const entry = JSON.parse(raw) as CacheEntry<unknown>;
        if (Date.now() < entry.expiresAt && !memoryCache.has(entry.key)) {
          memoryCache.set(entry.key, entry);
          touchAccess(entry.key);
          loaded++;
        } else if (Date.now() >= entry.expiresAt) {
          unlinkSync(join(CACHE_DIR, file));
        }
      } catch {
        /* skip corrupt file */
      }
    }
  } catch {
    /* dir not accessible */
  }
  return loaded;
}
