import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
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
 * Compose class strings safely. Built on `clsx` + `tailwind-merge`.
 *
 * Use with the `d()` token resolver for conditional classes and overrides:
 *   <div className={cn(d("base"), isActive && d("active"), className)} />
 *
 * - `clsx` handles falsy filter (undefined / false / null skipped)
 * - `tailwind-merge` resolves Tailwind conflicts (e.g. `bg-red-500` vs `bg-blue-500` -> keep the later class)
 *
 * Without `cn`, direct string concatenation cannot resolve conflicting
 * variants. When conditional and base classes both define `bg-*`, all classes
 * stay active and CSS resolution becomes ambiguous. `cn` normalizes that
 * automatically.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
