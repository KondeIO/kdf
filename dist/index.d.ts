import { type ClassValue } from "clsx";
import type { DesignAccessor, GetDesignOptions } from "./types.js";
export type { DesignAccessor, DesignTokenFile, DesignTokenValue, GetDesignOptions, KdfCacheMode, } from "./types.js";
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
export declare function getDesign(page: string, options?: GetDesignOptions): DesignAccessor;
/**
 * Compose class strings — UI-library agnostic. Built on `clsx` only.
 *
 *   <div className={cn(d("base"), isActive && d("active"), className)} />
 *
 * - Joins class values and filters falsy ones (undefined / false / null).
 * - Does NOT resolve framework-specific class conflicts — KDF stays
 *   styling-system agnostic and does not bundle a CSS-framework dependency.
 *
 * If your app uses a styling framework that needs conflict resolution, wrap
 * `cn` with your framework-specific merge helper in your own app:
 *
 *   import { cn as kcn } from "@kondeio/kdf";
 *   import { mergeFrameworkClasses } from "your-framework-merge";
 *   export const cn = (...a: unknown[]) => mergeFrameworkClasses(kcn(...(a as ClassValue[])));
 */
export declare function cn(...inputs: ClassValue[]): string;
