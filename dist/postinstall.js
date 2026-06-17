/**
 * postinstall — runs automatically after installing @kondeio/kdf.
 *
 * Creates kdf/ folder + konde CSS files in user's project root.
 * All writes are safe — never overwrites existing files.
 * Uses INIT_CWD (project root), not package directory.
 *
 * Set KDF_SKIP_INIT=1 to install the package without scaffolding files.
 */
import { mkdirSync, existsSync, copyFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { writeKondeCSS } from "./css-generator.js";
// INIT_CWD = project root (set by npm/bun during install)
// Fallback to cwd for direct execution
const projectRoot = process.env.INIT_CWD || process.cwd();
const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, "..", "kdf");
if (process.env.KDF_SKIP_INIT === "1" || process.env.KDF_SKIP_INIT === "true") {
    process.exit(0);
}
const targetDir = join(projectRoot, "kdf");
// Skip if already initialized
if (existsSync(targetDir)) {
    process.exit(0);
}
// Create kdf/ and kdf/shared/
mkdirSync(join(targetDir, "shared"), { recursive: true });
// Copy shared token files
const sharedDir = join(TEMPLATES_DIR, "shared");
if (existsSync(sharedDir)) {
    for (const file of readdirSync(sharedDir).filter((f) => f.endsWith(".json"))) {
        copyFileSync(join(sharedDir, file), join(targetDir, "shared", file));
    }
}
// Copy homepage.json as starter
const homepageSrc = join(TEMPLATES_DIR, "homepage.json");
if (existsSync(homepageSrc)) {
    copyFileSync(homepageSrc, join(targetDir, "homepage.json"));
}
// Generate empty CSS files inside kdf/ folder
writeKondeCSS(targetDir);
console.log("@kondeio/kdf initialized:");
console.log("  kdf/");
console.log("    shared/            ← design tokens");
console.log("    homepage.json");
console.log("    konde-server.css   ← critical overrides (import in layout.tsx)");
console.log("    konde.css          ← non-critical overrides (auto-injected last)");
//# sourceMappingURL=postinstall.js.map