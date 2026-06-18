# @kondeio/kdf - Konde Design Framework

Design-as-JSON. Works like i18n: one page maps to one JSON file.

KDF solves design drift in agent-assisted codebases where UI styling is
scattered across components, pages, and generated changes. Instead of asking an
agent to repeatedly guess "make this bigger", "use the same spacing", or "match
the other page", KDF puts design decisions in JSON so every element can point to
a stable design key.

KDF is **agent-first and user-owned**: agents read the design source of truth
before touching UI, while the user keeps control by editing plain JSON. The goal
is not to let agents design for the user; the goal is to stop agents from
guessing.

## Why

Styling drifts when class names live scattered across `.tsx` files:

- the same button slowly gets five different variants
- spacing changes page by page
- colors and typography become inconsistent
- every new AI session has to rediscover the design rules
- users spend time correcting visual guesses through chat

KDF moves the repeatable design layer into JSON:

- agents read tokens before changing UI
- users can edit design tokens directly
- `data-kdf` maps every DOM element back to its exact JSON path
- the same design key can be scanned, tested, reviewed, and edited later

KDF is a coordination layer over your existing styling stack: plain CSS, CSS
modules, utility CSS, Bootstrap, shadcn, or your own design system. It is not a
component library and not a CSS engine.

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

Example app structure:

```
my-app/
  app/
    page.tsx
    pricing/page.tsx
  components/
    hero.tsx
    pricing-table.tsx
  kdf/
    shared/
      button.json
      card.json
      color.json
      layout.json
      typography.json
    homepage.json
    pricing.json
    konde-server.css
    konde.css
  next.config.ts
```

Example token shape:

```json
{
  "$layout": ["hero", "features", "footer"],
  "hero": {
    "wrapper": "mx-auto max-w-6xl px-6 py-20",
    "title": "@typography.h1",
    "cta": "@button.cta"
  }
}
```

## Usage

```tsx
import { getDesign } from "@kondeio/kdf";

const d = getDesign("homepage");

<h1 data-kdf="hero.title" className={d("hero.title")}>
  {t("hero.headline")}
</h1>
```

## Class composition

KDF includes small class composition helpers that work with any UI library:

- `cn()` - join conditional classes, drop falsy values, dedupe exact duplicates.
- `cx()` - alias of `cn()`.
- `composeClasses()` - alias of `cn()` with a more explicit name.
- `dedupeClasses()` - remove exact duplicate class names from an existing string.
- `createClassComposer({ merge })` - create your own composer with an app-defined
  merge step.

The default behavior is intentionally universal. It does not try to understand
semantic conflicts like colors, spacing, variants, or framework-specific utility
groups. It only normalizes and dedupes exact class names.

```tsx
import { cn, getDesign } from "@kondeio/kdf";

const d = getDesign("homepage");

<button
  data-kdf="hero.cta"
  className={cn(d("hero.cta"), isActive && d("hero.cta-active"), className)}
>
  Start
</button>
```

Exact duplicate dedupe:

```ts
import { dedupeClasses } from "@kondeio/kdf";

dedupeClasses("btn btn btn-primary");
// "btn btn-primary"
```

Custom merge strategy:

```ts
import { createClassComposer } from "@kondeio/kdf";

const cn = createClassComposer({
  merge(className) {
    // Example: apply project-specific class rules here.
    return className;
  },
});
```

## Server-only

`getDesign()`, `d()`, and `d.css()` read JSON from disk via Node `fs`, so they
run on the **server only** — Next.js Server Components, Astro components, or any
server render. They do **not** work inside a Client Component (`"use client"`),
which has no filesystem.

For client components, resolve on the server and pass the resulting className
string down as a prop:

```tsx
// Server Component
const d = getDesign("homepage");
return <ClientThing className={d("hero.cta")} />;
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

For values not expressible as reusable classes:

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

Generated into `konde.css`. The plugin exposes its path via env
(`KDF_CLIENT_CSS`); wire the `<link>`/import in your app (e.g. last in
`globals.css`) — the plugin does not inject it for you.

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

## Documentation and Skills

- [`docs/kdf-doc-1.0.md`](./docs/kdf-doc-1.0.md) - full KDF 1.0 concept, architecture, conventions, and release notes.
- [`docs/kdf-skill-1.0.md`](./docs/kdf-skill-1.0.md) - agent-facing implementation and review checklist.
- [`docs/license.md`](./docs/license.md) - license rationale, alternatives considered, and publishing requirements.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for local setup, build/test commands,
and PR conventions. Keep the core UI-library agnostic and the resolver
server-only.

## Security

`@kondeio/kdf` runs a `postinstall` script that scaffolds a starter `kdf/`
folder into your project (never overwrites, no network calls). To skip it:
`npm install @kondeio/kdf --ignore-scripts` or `KDF_SKIP_INIT=1`. Full details
and vulnerability reporting in [SECURITY.md](./SECURITY.md).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## License

MIT. See `LICENSE` for the full license text and `docs/license.md` for the license decision notes.
