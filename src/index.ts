import { clsx, type ClassValue } from "clsx";
import type { DesignAccessor, GetDesignOptions } from "./types.js";
import { loadFile, resolveClassName, resolveCSS } from "./resolver.js";

export type {
  DesignAccessor,
  DesignTokenFile,
  DesignTokenValue,
  GetDesignOptions,
  KdfCacheMode,
} from "./types.js";
export { clearKdfCache } from "./resolver.js";

export type ClassMergeFunction = (className: string) => string;

export interface ClassComposerOptions {
  /**
   * Optional app-defined semantic merge step.
   *
   * KDF's default merge only removes exact duplicate classes. If an app wants
   * semantic rules such as "keep the last class in this project-specific group",
   * inject that logic here.
   */
  merge?: ClassMergeFunction;
}

/**
 * Get design accessor for a page.
 *
 * Usage:
 *   const d = getDesign("homepage");
 *   <h1 data-kdf="hero.title" className={d("hero.title")}>{t("hero.headline")}</h1>
 *
 * Resolution order: kdf/<page>.json -> kdf/shared/
 */
export function getDesign(page: string, options?: GetDesignOptions): DesignAccessor {
  const accessor = ((path: string): string => {
    const pageTokens = loadFile(page, options);
    return resolveClassName(path, pageTokens, options);
  }) as DesignAccessor;

  accessor.css = (path: string): Record<string, string> => {
    const pageTokens = loadFile(page, options);
    return resolveCSS(path, pageTokens);
  };

  return accessor;
}

/**
 * Remove exact duplicate class names while preserving first-seen order.
 *
 * This is intentionally semantic-free: it does not try to understand any CSS
 * framework. It only turns "btn btn btn-primary" into "btn btn-primary".
 */
export function dedupeClasses(className: string): string {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const part of className.trim().split(/\s+/)) {
    if (!part || seen.has(part)) continue;
    seen.add(part);
    output.push(part);
  }

  return output.join(" ");
}

/**
 * Create a UI-library agnostic class composer.
 *
 * Default behavior:
 * - flatten strings, arrays, and objects through clsx
 * - drop falsy values
 * - normalize whitespace
 * - remove exact duplicate class names
 *
 * Apps that need semantic class conflict handling can inject their own merge
 * function. KDF does not ship CSS-framework-specific class rules.
 */
export function createClassComposer(options: ClassComposerOptions = {}) {
  const merge = options.merge ?? dedupeClasses;

  return (...inputs: ClassValue[]): string => {
    const joined = clsx(...inputs);
    return merge(joined);
  };
}

export const composeClasses = createClassComposer();
export const cx = composeClasses;
export const cn = composeClasses;
