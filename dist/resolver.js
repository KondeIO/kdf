import { readFileSync, statSync } from "fs";
import { isAbsolute, join } from "path";
import { resolveClassName as resolveClassNameFromTokens, resolveCSS, } from "./create-design.js";
/** Returns KDF root path — reads env at call time, not module load time */
function getKdfRoot() {
    const dir = process.env.KDF_DIR || "kdf";
    return isAbsolute(dir) ? dir : join(process.cwd(), dir);
}
const DEFAULT_DEV_CACHE_MAX_AGE_MS = 250;
/** Cache: path -> parsed JSON plus lightweight file identity */
const cache = new Map();
function getCacheMode(options) {
    return options?.cache ?? "auto";
}
function getDevMaxAgeMs(options) {
    if (typeof options?.maxAgeMs === "number" && options.maxAgeMs >= 0) {
        return options.maxAgeMs;
    }
    const fromEnv = Number(process.env.KDF_CACHE_MAX_AGE_MS);
    if (Number.isFinite(fromEnv) && fromEnv >= 0) {
        return fromEnv;
    }
    return DEFAULT_DEV_CACHE_MAX_AGE_MS;
}
function readJsonFile(filePath) {
    try {
        return JSON.parse(readFileSync(filePath, "utf-8"));
    }
    catch {
        return null;
    }
}
function loadJsonFile(filePath, options) {
    const mode = getCacheMode(options);
    if (mode === "none") {
        return readJsonFile(filePath);
    }
    const cached = cache.get(filePath);
    if (mode === "always" || process.env.NODE_ENV === "production") {
        if (cached)
            return cached.value;
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
    }
    catch {
        cache.set(filePath, { value: null, mtimeMs: -1, size: -1, checkedAt: now });
        return null;
    }
}
export function clearKdfCache() {
    cache.clear();
}
function loadFile(name, options) {
    const filePath = join(getKdfRoot(), `${name}.json`);
    return loadJsonFile(filePath, options);
}
/** Load JSON from absolute path (for root shared fallback) */
function loadFileAbsolute(filePath, options) {
    return loadJsonFile(filePath, options);
}
function getByPath(obj, path) {
    return path.split(".").reduce((acc, key) => {
        if (acc && typeof acc === "object" && key in acc) {
            return acc[key];
        }
        return undefined;
    }, obj);
}
function resolveFileRef(component, key, options) {
    // 1. Template-specific shared (e.g., designs/lander/shared/button.json)
    const templateShared = loadFile(`shared/${component}`, options);
    if (templateShared) {
        const resolved = getByPath(templateShared, key);
        if (resolved !== undefined)
            return resolved;
    }
    // 2. Root shared fallback (e.g., designs/shared/button.json)
    const rootShared = loadFileAbsolute(join(getKdfRoot(), "..", "shared", `${component}.json`), options);
    if (rootShared) {
        return getByPath(rootShared, key);
    }
    return undefined;
}
/** Resolve className for a token path.
 *  Looks in page JSON first. @references resolve from shared/ files. */
export function resolveClassName(path, pageTokens, options) {
    return resolveClassNameFromTokens(path, pageTokens, {
        resolveRef: (component, key) => resolveFileRef(component, key, options),
    });
}
export { loadFile, getKdfRoot };
export { resolveCSS };
