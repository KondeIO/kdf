import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import {
  clearKdfCache,
  cn,
  composeClasses,
  createDesign,
  createClassComposer,
  cx,
  dedupeClasses,
  getDesign,
} from "./src/index";
import { createDesign as createEdgeDesign } from "./src/edge";
import { loadFile } from "./src/resolver";

let pass = 0;
let fail = 0;

function assert(name: string, actual: unknown, expected: unknown): void {
  if (actual === expected) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}`);
    console.log(`        expected: ${JSON.stringify(expected)}`);
    console.log(`        actual:   ${JSON.stringify(actual)}`);
  }
}

function assertIncludes(name: string, actual: string, expected: string): void {
  if (actual.includes(expected)) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}`);
    console.log(`        expected to include: ${JSON.stringify(expected)}`);
    console.log(`        actual: ${JSON.stringify(actual)}`);
  }
}

// ── Test: loadFile ──
console.log("\nloadFile");
assert("loads homepage.json", loadFile("homepage") !== null, true);
assert("loads shared/button.json", loadFile("shared/button") !== null, true);
assert("returns null for missing", loadFile("nonexistent"), null);

// ── Test: getDesign basic ──
console.log("\ngetDesign basic");
const d = getDesign("homepage");
assert("d is a function", typeof d, "function");
assert("d.css is a function", typeof d.css, "function");

// ── Test: plain className (no @ref) ──
console.log("\nplain className");
assert("hero.wrapper", d("hero.wrapper"), "flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between");
assert("hero.content", d("hero.content"), "w-full lg:max-w-[500px]");

// ── Test: single @ref ──
console.log("\nsingle @ref");
const title = d("hero.title");
assertIncludes("hero.title resolves @typography.h1", title, "text-3xl");
assertIncludes("hero.title includes font-bold", title, "font-bold");

// ── Test: @ref + extra classes ──
console.log("\n@ref + extra classes");
const desc = d("hero.description");
assertIncludes("hero.description starts with mt-4", desc, "mt-4");
assertIncludes("hero.description includes body text", desc, "text-sm");

// ── Test: multi @ref ──
console.log("\nmulti @ref");
const cta = d("hero.cta-primary");
assertIncludes("cta has base (inline-flex)", cta, "inline-flex");
assertIncludes("cta has cta (shadow-lg)", cta, "shadow-lg");
assertIncludes("cta has md (px-4)", cta, "px-4");

const ctaSec = d("hero.cta-secondary");
assertIncludes("cta-secondary has outline (border)", ctaSec, "border");

// ── Test: nested @ref (card) ──
console.log("\nnested @ref via page tokens");
const card = d("template-grid.card");
assertIncludes("card has base (rounded-lg)", card, "rounded-lg");
assertIncludes("card has hover (hover:shadow-md)", card, "hover:shadow-md");

// ── Test: missing path ──
console.log("\nmissing path");
assert("nonexistent returns empty", d("does.not.exist"), "");

// ── Test: CSS custom properties ──
console.log("\ncss()");
const css = d.css("hero.title");
assert("no css on hero.title", Object.keys(css).length, 0);

// ── Test: createDesign from imported JSON tokens ──
console.log("\ncreateDesign object API");
const objectDesign = createDesign(
  {
    hero: {
      wrapper: "mx-auto",
      cta: "@button.base @button.primary px-4",
      card: "@card.base",
      local: "@hero.wrapper text-lg",
      title: {
        className: "@typography.h1",
        css: { "--kdf-accent": "#2563eb" },
      },
    },
  },
  {
    button: {
      base: "inline-flex",
      primary: "bg-blue-600 text-white",
    },
    card: {
      base: {
        className: "rounded-lg border",
      },
    },
    typography: {
      h1: "text-4xl font-semibold",
    },
  },
);
assert("createDesign plain token", objectDesign("hero.wrapper"), "mx-auto");
assert("createDesign resolves shared refs", objectDesign("hero.cta"), "inline-flex bg-blue-600 text-white px-4");
assert("createDesign resolves object shared refs", objectDesign("hero.card"), "rounded-lg border");
assert("createDesign resolves page refs", objectDesign("hero.local"), "mx-auto text-lg");
assert("createDesign resolves css", objectDesign.css("hero.title")["--kdf-accent"], "#2563eb");

const edgeDesign = createEdgeDesign(
  { hero: { cta: "@button.base" } },
  { button: { base: "inline-flex" } },
);
assert("edge export resolves shared refs", edgeDesign("hero.cta"), "inline-flex");

// ── Test: pricing page ──
console.log("\npricing page");
const originalKdfDirForPricing = process.env.KDF_DIR;
const pricingTempRoot = join(process.cwd(), ".tmp-kdf-pricing-test");
const pricingTempDir = join(pricingTempRoot, "designs");
rmSync(pricingTempRoot, { recursive: true, force: true });
mkdirSync(join(pricingTempDir, "shared"), { recursive: true });
writeFileSync(join(pricingTempDir, "shared", "button.json"), JSON.stringify({
  base: "inline-flex",
  primary: "bg-blue-600 text-white",
  md: "px-4 py-2",
}));
writeFileSync(join(pricingTempDir, "pricing.json"), JSON.stringify({
  plans: {
    cta: "@button.base @button.primary @button.md w-full justify-center",
  },
}));
process.env.KDF_DIR = pricingTempDir;
clearKdfCache();
const dp = getDesign("pricing", { cache: "none" });
const price = dp("plans.cta");
assertIncludes("pricing cta has primary (bg-blue-600)", price, "bg-blue-600");
process.env.KDF_DIR = originalKdfDirForPricing;
clearKdfCache();
rmSync(pricingTempRoot, { recursive: true, force: true });

// ── Test: dev cache revalidation ──
console.log("\ndev cache revalidation");
const originalKdfDir = process.env.KDF_DIR;
const tempRoot = join(process.cwd(), ".tmp-kdf-test");
const tempDir = join(tempRoot, "designs");
rmSync(tempRoot, { recursive: true, force: true });
mkdirSync(join(tempDir, "shared"), { recursive: true });
writeFileSync(join(tempDir, "shared", "button.json"), JSON.stringify({ base: "inline-flex" }));
writeFileSync(join(tempDir, "homepage.json"), JSON.stringify({ hero: { cta: "@button.base text-red-500" } }));
process.env.KDF_DIR = tempDir;
clearKdfCache();

const cached = getDesign("homepage", { maxAgeMs: 10_000 });
assert("uses cached value inside maxAgeMs", cached("hero.cta"), "inline-flex text-red-500");
writeFileSync(join(tempDir, "homepage.json"), JSON.stringify({ hero: { cta: "@button.base text-blue-500" } }));
assert("does not re-read inside maxAgeMs", cached("hero.cta"), "inline-flex text-red-500");

const uncached = getDesign("homepage", { cache: "none" });
assert("cache none re-reads changed value", uncached("hero.cta"), "inline-flex text-blue-500");

process.env.KDF_DIR = originalKdfDir;
clearKdfCache();
rmSync(tempRoot, { recursive: true, force: true });

// ── Test: class composition ──
console.log("\nclass composition");
assert("cn joins conditional classes", cn("btn", false, null, undefined, "btn-primary"), "btn btn-primary");
assert("cn removes exact duplicates", cn("btn btn", "btn-primary", "btn"), "btn btn-primary");
assert("dedupeClasses preserves first-seen order", dedupeClasses("b a b c a"), "b a c");
assert("composeClasses flattens arrays and objects", composeClasses(["btn", ["active"]], { disabled: false, primary: true }), "btn active primary");
assert("cx aliases composeClasses", cx("a", "a", "b"), "a b");

const customComposer = createClassComposer({
  merge(className) {
    return className
      .split(/\s+/)
      .filter((part) => !part.startsWith("drop-"))
      .join(" ");
  },
});
assert("createClassComposer accepts custom merge", customComposer("keep drop-old", "next"), "keep next");

// ── Result ──
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail > 0 ? 1 : 0);
