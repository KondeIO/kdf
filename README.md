# @kondeio/kdf - Konde Design Framework

Design-as-JSON. Works like i18n: one page maps to one JSON file.

## Install

Default install scaffolds the starter `kdf/` folder if it does not exist.
Existing files are never overwritten.

```bash
npm install @kondeio/kdf
pnpm add @kondeio/kdf
bun add @kondeio/kdf
```

If you want to install the dependency without running the initializer:

```bash
npm install @kondeio/kdf --ignore-scripts
```

You can run initialization manually later:

```bash
npx kdf init
```

`npx kdf init` uses the local package binary when `@kondeio/kdf` is already
installed in the project.

## Structure

```
kdf/
  shared/              <- shared defaults (button, typography, layout, card)
  homepage.json        <- full homepage design
  pricing.json         <- pricing page overrides
```

## Usage

```tsx
import { getDesign } from "@kondeio/kdf";

const d = getDesign("homepage");

<h1 data-kdf="hero.title" className={d("hero.title")}>
  {t("hero.headline")}
</h1>
```

## @reference

Reference shared tokens from shared/:

```json
{ "hero": { "cta": "@button.cta" } }
```

Extend with extra classes:

```json
{ "hero": { "cta": "@button.cta shadow-xl text-lg" } }
```

Multiple refs:

```json
{ "hero": { "login": "@button.base @button.ghost @button.sm" } }
```

## data-kdf attribute

Every element using `d()` MUST have `data-kdf`:

```tsx
<div data-kdf="hero.wrapper" className={d("hero.wrapper")}>
```

Enables: agent scanning, visual editor (V2), Playwright testing.

## Cache behavior

KDF caches design JSON files by default. In development it revalidates with
file `mtime`/`size` checks so repeated `d()` calls do not create disk-read
storms during HMR.

```tsx
const d = getDesign("homepage", { cache: "auto", maxAgeMs: 250 });
```

Use `clearKdfCache()` for explicit invalidation in custom tooling.

## CSS custom properties

For values not expressible in Tailwind:

```json
{
  "hero": {
    "title": {
      "className": "text-3xl",
      "css": { "--kdf-accent": "oklch(0.546 0.245 262)" }
    }
  }
}
```

Generated into `konde.css`, loaded last in globals.css.

## Commands

- `kdf init` - scaffold the starter `kdf/` folder and generated CSS files.

## Config

```ts
// next.config.ts
import withKDF from "@kondeio/kdf/plugin";
export default withKDF()(nextConfig);

// Custom dir:
export default withKDF({ dir: "./my-design" })(nextConfig);
```

## Key symbols

| Symbol | Purpose | Example |
|--------|---------|---------|
| `$` | Component binding (WHAT to render) | `"$": "Button"` |
| `@` | Reference (WHERE to get styling) | `"@button.cta"` |
| `$layout` | Page sections + order | `["hero", "footer"]` |

## License

MIT
