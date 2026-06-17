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
 * Remove exact duplicate class names while preserving first-seen order.
 *
 * This is intentionally semantic-free: it does not try to understand any CSS
 * framework. It only turns "btn btn btn-primary" into "btn btn-primary".
 */
export function dedupeClasses(className) {
    const seen = new Set();
    const output = [];
    for (const part of className.trim().split(/\s+/)) {
        if (!part || seen.has(part))
            continue;
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
export function createClassComposer(options = {}) {
    const merge = options.merge ?? dedupeClasses;
    return (...inputs) => {
        const joined = clsx(...inputs);
        return merge(joined);
    };
}
export const composeClasses = createClassComposer();
export const cx = composeClasses;
export const cn = composeClasses;
