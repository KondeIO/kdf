import type { DesignAccessor, DesignSharedTokens, DesignTokenFile } from "./types.js";

interface ResolveRuntimeOptions {
  shared?: DesignSharedTokens;
  resolveRef?: (component: string, key: string) => unknown;
}

/** Get value from nested object by dot-path */
function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Resolve a single @reference: "@button.cta"
 * @button.cta -> shared.button.cta, external resolver, or page-level fallback.
 */
function resolveSingleRef(
  ref: string,
  pageTokens: DesignTokenFile | null,
  depth: number,
  options?: ResolveRuntimeOptions,
): string {
  if (depth > 5) return "";

  const refPart = ref.slice(1); // remove @
  const dotIdx = refPart.indexOf(".");
  const component = dotIdx > 0 ? refPart.slice(0, dotIdx) : refPart;
  const key = dotIdx > 0 ? refPart.slice(dotIdx + 1) : "";

  // Reject path-traversal when a file-backed resolver is used.
  if (!/^[A-Za-z0-9_-]+$/.test(component)) {
    if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
      console.warn(`[kdf] ignoring unsafe @ref component: "${component}"`);
    }
    return "";
  }

  let resolved: unknown = undefined;

  const sharedToken = options?.shared?.[component];
  if (key && sharedToken) {
    resolved = getByPath(sharedToken as Record<string, unknown>, key);
  }

  if (resolved === undefined && key && options?.resolveRef) {
    resolved = options.resolveRef(component, key);
  }

  if (resolved === undefined && pageTokens) {
    resolved = getByPath(pageTokens as Record<string, unknown>, refPart);
  }

  if (typeof resolved === "string") {
    return resolveTokenString(resolved, pageTokens, depth + 1, options);
  }
  if (resolved && typeof resolved === "object" && "className" in resolved) {
    const className = (resolved as { className: string }).className;
    return resolveTokenString(className, pageTokens, depth + 1, options);
  }
  return "";
}

/**
 * Resolve a token string that may contain multiple @refs and plain classes.
 * Examples:
 *   "@button.cta"                           -> resolves single ref
 *   "@button.cta shadow-xl"                 -> resolves ref + extra classes
 *   "@button.base @button.ghost @button.sm" -> resolves all refs
 */
function resolveTokenString(
  value: string,
  pageTokens: DesignTokenFile | null,
  depth = 0,
  options?: ResolveRuntimeOptions,
): string {
  if (depth > 5) return value;

  const parts = value.split(/\s+/).filter(Boolean);
  const resolved = parts.map((part) => {
    if (part.startsWith("@")) {
      return resolveSingleRef(part, pageTokens, depth, options);
    }
    return part;
  });

  return resolved.filter(Boolean).join(" ");
}

/** Resolve className for a token path. */
export function resolveClassName(
  path: string,
  pageTokens: DesignTokenFile | null,
  options?: ResolveRuntimeOptions,
): string {
  const val: unknown = pageTokens
    ? getByPath(pageTokens as Record<string, unknown>, path)
    : undefined;
  if (val === undefined) return "";

  if (typeof val === "string") {
    return resolveTokenString(val, pageTokens, 0, options);
  }
  if (typeof val === "object" && val && "className" in val) {
    const className = (val as { className: string }).className;
    return resolveTokenString(className, pageTokens, 0, options);
  }
  return "";
}

/** Resolve CSS custom properties for a token path */
export function resolveCSS(
  path: string,
  pageTokens: DesignTokenFile | null,
): Record<string, string> {
  const val: unknown = pageTokens
    ? getByPath(pageTokens as Record<string, unknown>, path)
    : undefined;
  if (val && typeof val === "object" && "css" in val) {
    return (val as { css: Record<string, string> }).css;
  }
  return {};
}

/**
 * Create a design accessor from imported JSON token objects.
 *
 * This is the preferred API for edge runtimes and build-time bundlers because
 * the host app imports JSON explicitly instead of asking KDF to read a path at
 * runtime.
 */
export function createDesign(
  pageTokens: DesignTokenFile | null,
  shared: DesignSharedTokens = {},
): DesignAccessor {
  const accessor = ((path: string): string => {
    return resolveClassName(path, pageTokens, { shared });
  }) as DesignAccessor;

  accessor.css = (path: string): Record<string, string> => {
    return resolveCSS(path, pageTokens);
  };

  return accessor;
}
