#!/usr/bin/env node
import { mkdirSync, existsSync, copyFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { writeKondeCSS } from "./css-generator.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, "..", "kdf");

const commands: Record<string, () => void> = {
  init: cmdInit,
};

function cmdInit(): void {
  const targetDir = join(process.cwd(), process.env.KDF_DIR || "kdf");

  if (existsSync(targetDir)) {
    console.log("kdf/ directory already exists. Skipping init.");
    return;
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

  console.log("Initialized:");
  console.log("");
  console.log("  kdf/");
  console.log("    shared/");
  console.log("      button.json");
  console.log("      typography.json");
  console.log("      card.json");
  console.log("      layout.json");
  console.log("    homepage.json");
  console.log("    konde-server.css  (critical overrides — import in layout.tsx)");
  console.log("    konde.css         (non-critical overrides — <link> last in <head>)");
}

// --- Main ---
const command = process.argv[2];

if (!command || !commands[command]) {
    console.log("@kondeio/kdf - Design-as-JSON for Next.js");
  console.log("");
  console.log("Commands:");
  console.log("  init       Scaffold kdf/ folder + konde.css");
  console.log("");
  console.log("Usage:");
    console.log("  npx @kondeio/kdf init");
  process.exit(command ? 1 : 0);
}

commands[command]();
