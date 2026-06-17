import { readFileSync, statSync } from "fs";
import { isAbsolute, join } from "path";
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
/** Get value from nested object by dot-path */
function getByPath(obj, path) {
    return path.split(".").reduce((acc, key) => {
        if (acc && typeof acc === "object" && key in acc) {
            return acc[key];
        }
        return undefined;
    }, obj);
}
/**
 * Resolve a single @reference: "@button.cta"
 * @button.cta -> load shared/button.json -> key "cta"
 */
function resolveSingleRef(ref, pageTokens, depth, options) {
    if (depth > 5)
        return "";
    const refPart = ref.slice(1); // remove @
    const dotIdx = refPart.indexOf(".");
    const component = dotIdx > 0 ? refPart.slice(0, dotIdx) : refPart;
    const key = dotIdx > 0 ? refPart.slice(dotIdx + 1) : "";
    // Reject path-traversal in the component name: it becomes part of a file path
    // (shared/<component>.json). A ref like "@../../secret.x" must never escape the
    // shared/ folder. Allow only safe filename chars.
    if (!/^[A-Za-z0-9_-]+$/.test(component)) {
        if (process.env.NODE_ENV !== "production") {
            console.warn(`[kdf] ignoring unsafe @ref component: "${component}"`);
        }
        return "";
    }
    // Load shared/<component>.json — cascade: template shared → root shared
    let resolved = undefined;
    // 1. Template-specific shared (e.g., designs/lander/shared/button.json)
    const templateShared = loadFile(`shared/${component}`, options);
    if (key && templateShared) {
        resolved = getByPath(templateShared, key);
    }
    // 2. Root shared fallback (e.g., designs/shared/button.json)
    if (resolved === undefined && key) {
        const rootShared = loadFileAbsolute(join(getKdfRoot(), "..", "shared", `${component}.json`), options);
        if (rootShared) {
            resolved = getByPath(rootShared, key);
        }
    }
    // 3. Fallback: check page-level tokens
    if (resolved === undefined && pageTokens) {
        resolved = getByPath(pageTokens, refPart);
    }
    if (typeof resolved === "string") {
        // Resolved value might itself contain @refs
        return resolveTokenString(resolved, pageTokens, depth + 1, options);
    }
    if (resolved && typeof resolved === "object" && "className" in resolved) {
        const cn = resolved.className;
        return resolveTokenString(cn, pageTokens, depth + 1, options);
    }
    return "";
}
/**
 * Resolve a token string that may contain multiple @refs and plain classes.
 * Examples:
 *   "@button.cta"                         -> resolves single ref
 *   "@button.cta shadow-xl"               -> resolves ref + appends classes
 *   "@button.base @button.ghost @button.sm" -> resolves all three refs
 */
function resolveTokenString(value, pageTokens, depth = 0, options) {
    if (depth > 5)
        return value;
    const parts = value.split(/\s+/).filter(Boolean);
    const resolved = parts.map((part) => {
        if (part.startsWith("@")) {
            return resolveSingleRef(part, pageTokens, depth, options);
        }
        return part;
    });
    return resolved.filter(Boolean).join(" ");
}
/** Resolve className for a token path.
 *  Looks in page JSON first. @references resolve from shared/ files. */
export function resolveClassName(path, pageTokens, options) {
    const val = pageTokens
        ? getByPath(pageTokens, path)
        : undefined;
    if (val === undefined)
        return "";
    if (typeof val === "string") {
        return resolveTokenString(val, pageTokens, 0, options);
    }
    if (typeof val === "object" && val && "className" in val) {
        const cn = val.className;
        return resolveTokenString(cn, pageTokens, 0, options);
    }
    return "";
}
/** Resolve CSS custom properties for a token path */
export function resolveCSS(path, pageTokens) {
    const val = pageTokens
        ? getByPath(pageTokens, path)
        : undefined;
    if (val && typeof val === "object" && "css" in val) {
        return val.css;
    }
    return {};
}
export { loadFile, getKdfRoot };
