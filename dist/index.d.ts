import type { DesignAccessor, GetDesignOptions } from "./types.js";
export { cn, composeClasses, createClassComposer, cx, dedupeClasses, type ClassComposerOptions, type ClassMergeFunction, } from "./class-compose.js";
export { createDesign } from "./create-design.js";
export type { DesignAccessor, DesignSharedTokens, DesignTokenFile, DesignTokenValue, GetDesignOptions, KdfCacheMode, } from "./types.js";
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
