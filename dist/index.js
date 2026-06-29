import { loadFile, resolveClassName, resolveCSS } from "./resolver.js";
export { cn, composeClasses, createClassComposer, cx, dedupeClasses, } from "./class-compose.js";
export { createDesign } from "./create-design.js";
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
