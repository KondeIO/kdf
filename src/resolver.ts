import type { DesignTokenFile, GetDesignOptions, KdfCacheMode } from "./types.js";
import { readFileSync, statSync } from "fs";
import { isAbsolute, join } from "path";
import {
  resolveClassName as resolveClassNameFromTokens,
  resolveCSS,
} from "./create-design.js";

/** Returns KDF root path — reads env at call time, not module load time */
function getKdfRoot(): string {
  const dir = process.env.KDF_DIR || "kdf";
  return isAbsolute(dir) ? dir : join(process.cwd(), dir);
}

interface CacheEntry {
  value: DesignTokenFile | null;
  mtimeMs: number;
  size: number;
  checkedAt: number;
}

const DEFAULT_DEV_CACHE_MAX_AGE_MS = 250;

/** Cache: path -> parsed JSON plus lightweight file identity */
const cache = new Map<string, CacheEntry>();

function getCacheMode(options?: GetDesignOptions): KdfCacheMode {
  return options?.cache ?? "auto";
}

function getDevMaxAgeMs(options?: GetDesignOptions): number {
  if (typeof options?.maxAgeMs === "number" && options.maxAgeMs >= 0) {
    return options.maxAgeMs;
  }

  const fromEnv = Number(process.env.KDF_CACHE_MAX_AGE_MS);
  if (Number.isFinite(fromEnv) && fromEnv >= 0) {
    return fromEnv;
  }

  return DEFAULT_DEV_CACHE_MAX_AGE_MS;
}

function readJsonFile(filePath: string): DesignTokenFile | null {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as DesignTokenFile;
  } catch {
    return null;
  }
}

function loadJsonFile(filePath: string, options?: GetDesignOptions): DesignTokenFile | null {
  const mode = getCacheMode(options);
  if (mode === "none") {
    return readJsonFile(filePath);
  }

  const cached = cache.get(filePath);
  if (mode === "always" || process.env.NODE_ENV === "production") {
    if (cached) return cached.value;
    const value = readJsonFile(filePath);
    cache.set(filePath, { value, mtimeMs: -1, size: -1, checkedAt: Date.now() });
    return value;
  }

  const now = Date.now();
  const maxAgeMs = getDevMaxAgeMs(options);
  if (cached && now - cached.checkedAt < maxAgeMs) {
    return cached.value;
  }

  try {
    const stat = statSync(filePath);
    if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
      cached.checkedAt = now;
      return cached.value;
    }

    const value = readJsonFile(filePath);
    cache.set(filePath, {
      value,
      mtimeMs: stat.mtimeMs,
      size: stat.size,
      checkedAt: now,
    });
    return value;
  } catch {
    cache.set(filePath, { value: null, mtimeMs: -1, size: -1, checkedAt: now });
    return null;
  }
}

export function clearKdfCache(): void {
  cache.clear();
}

function loadFile(name: string, options?: GetDesignOptions): DesignTokenFile | null {
  const filePath = join(getKdfRoot(), `${name}.json`);
  return loadJsonFile(filePath, options);
}

/** Load JSON from absolute path (for root shared fallback) */
function loadFileAbsolute(filePath: string, options?: GetDesignOptions): DesignTokenFile | null {
  return loadJsonFile(filePath, options);
}

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function resolveFileRef(component: string, key: string, options?: GetDesignOptions): unknown {
  // 1. Template-specific shared (e.g., designs/lander/shared/button.json)
  const templateShared = loadFile(`shared/${component}`, options);
  if (templateShared) {
    const resolved = getByPath(templateShared as Record<string, unknown>, key);
    if (resolved !== undefined) return resolved;
  }

  // 2. Root shared fallback (e.g., designs/shared/button.json)
  const rootShared = loadFileAbsolute(join(getKdfRoot(), "..", "shared", `${component}.json`), options);
  if (rootShared) {
    return getByPath(rootShared as Record<string, unknown>, key);
  }

  return undefined;
}

/** Resolve className for a token path.
 *  Looks in page JSON first. @references resolve from shared/ files. */
export function resolveClassName(
  path: string,
  pageTokens: DesignTokenFile | null,
  options?: GetDesignOptions,
): string {
  return resolveClassNameFromTokens(path, pageTokens, {
    resolveRef: (component, key) => resolveFileRef(component, key, options),
  });
}

export { loadFile, getKdfRoot };
export { resolveCSS };
