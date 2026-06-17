import { writeFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Generate empty konde-server.css scaffold.
 * Server-side loaded (import in layout.tsx) — inlined in HTML, no FOUC.
 * For critical overrides that must be present on first paint.
 */
export function generateKondeServerCSS(): string {
  return `/* konde-server.css — Critical design overrides (server-rendered) */
/* Imported in layout.tsx — inlined in HTML, no FOUC */
/* Edit freely — KDF will never overwrite this file */

/* Use for:
   - Critical layout fixes that cause visual shift
   - CSS custom properties needed on first paint
   - Override shared component visibility per page

   Examples:
   :root { --kdf-primary: #4F46E5; }
   [data-kdf="hero.slider"] { display: none; }
*/
`;
}

/**
 * Generate empty konde.css scaffold.
 * Client-side loaded (<link> last in <head>) — highest specificity.
 * For non-critical overrides, experiments, CSS hacks.
 */
export function generateKondeCSS(): string {
  return `/* konde.css — Custom design overrides (client-side) */
/* Loaded LAST in <head> via <link> — highest specificity */
/* Edit freely — KDF will never overwrite this file */

/* Use for:
   - Fine-tune padding/margin/width
   - Non-critical visual tweaks
   - Quick experiments and CSS hacks

   Examples:
   [data-kdf="hero.title"] { letter-spacing: -0.02em; }
   [data-kdf="hero.wrapper"] { gap: 3rem; }
*/
`;
}

/**
 * Write CSS files to disk — only if file doesn't exist.
 * Safe to call multiple times; never overwrites user edits.
 */
export function writeKondeCSS(outputDir?: string): void {
  const dir = outputDir || process.cwd();
  const serverCss = join(dir, "konde-server.css");
  const clientCss = join(dir, "konde.css");

  if (!existsSync(serverCss)) {
    writeFileSync(serverCss, generateKondeServerCSS(), "utf-8");
  }
  if (!existsSync(clientCss)) {
    writeFileSync(clientCss, generateKondeCSS(), "utf-8");
  }
}
