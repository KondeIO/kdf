import { clsx } from "clsx";
import { loadFile, resolveClassName, resolveCSS } from "./resolver.js";
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
export function getDesign(page, options) {
    const accessor = ((path) => {
        const pageTokens = loadFile(page, options);
        return resolveClassName(path, pageTokens, options);
    });
    accessor.css = (path) => {
        const pageTokens = loadFile(page, options);
        return resolveCSS(path, pageTokens);
    };
    return accessor;
}
/**
 * Compose class strings — UI-library agnostic. Built on `clsx` only.
 *
 *   <div className={cn(d("base"), isActive && d("active"), className)} />
 *
 * - Joins class values and filters falsy ones (undefined / false / null).
 * - Does NOT resolve Tailwind conflicts — KDF stays styling-system agnostic
 *   and does not bundle a Tailwind-specific dependency.
 *
 * If you use Tailwind and want later classes to win over conflicting earlier
 * ones (e.g. `bg-red-500` then `bg-blue-500`), wrap `cn` with `tailwind-merge`
 * in your own app:
 *
 *   import { cn as kcn } from "@kondeio/kdf";
 *   import { twMerge } from "tailwind-merge";
 *   export const cn = (...a: unknown[]) => twMerge(kcn(...(a as ClassValue[])));
 */
export function cn(...inputs) {
    return clsx(inputs);
}
