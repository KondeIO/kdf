import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
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
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
//# sourceMappingURL=index.js.map