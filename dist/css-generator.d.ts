/**
 * Generate empty konde-server.css scaffold.
 * Server-side loaded (import in layout.tsx) — inlined in HTML, no FOUC.
 * For critical overrides that must be present on first paint.
 */
export declare function generateKondeServerCSS(): string;
/**
 * Generate empty konde.css scaffold.
 * Client-side loaded (<link> last in <head>) — highest specificity.
 * For non-critical overrides, experiments, CSS hacks.
 */
export declare function generateKondeCSS(): string;
/**
 * Write CSS files to disk — only if file doesn't exist.
 * Safe to call multiple times; never overwrites user edits.
 */
export declare function writeKondeCSS(outputDir?: string): void;
