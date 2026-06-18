# @kondeio/kdf - Konde Design Framework

Agent-first design consistency for Node-powered web apps.

KDF gives AI agents a JSON source of truth for layout, spacing, typography, and
component styling. Agents can build or update UI from that source in
server-side JavaScript apps instead of rediscovering design rules across
components, pages, and previous sessions.

Think of it like i18n for design: one page maps to one JSON file, and each
rendered element can point back to its exact design key with `data-kdf`. Users
stay in the approval loop and adjust the source only when intent or product
direction changes.

## Why

Styling drifts when class names live only inside `.tsx` files:

- the same button slowly gets five different variants
- spacing changes page by page
- colors and typography become inconsistent
- each new AI session has to rediscover the design rules
- users spend time correcting visual drift through chat

KDF moves repeatable styling into JSON:

- agents apply tokens before changing UI
- users can review and adjust the source when needed
- `data-kdf` maps every DOM element back to its exact JSON path
- the same design key can be scanned, tested, reviewed, and edited later

KDF works with your existing styling stack: plain CSS, CSS modules, utility CSS,
Bootstrap, shadcn, or a custom design system. It is not a component library and
not a CSS engine.

## Runtime Support

KDF core runs in Node/server-side JavaScript environments because it reads JSON
from disk with Node `fs`.

- Works with server-rendered Next.js, Astro, Hono, or similar Node runtimes.
- The included `@kondeio/kdf/plugin` export is the official Next.js integration.
- Next.js plugin target: App Router, Next.js 14+ (`next >=14`).
- `getDesign()`, `d()`, and `d.css()` are server-only. Browser/client
  components cannot call them directly; resolve classes server-side and pass
  class names down when needed.

| Framework | Status | How KDF is used |
| --- | --- | --- |
| Next.js | Tested | Core API in server-rendered code, plus the official `@kondeio/kdf/plugin` integration. |
| Astro | Tested | Core API in server-rendered code. |
| Hono | Tested | Core API in server handlers. |

## Install

Install the package:

```bash
npm install @kondeio/kdf
pnpm add @kondeio/kdf
bun add @kondeio/kdf
```

By default, install also scaffolds a starter `kdf/` folder when one does not
already exist. Existing files are never overwritten.

To install the dependency without running the initializer:

```bash
npm install @kondeio/kdf --ignore-scripts
```

Run initialization manually later:

```bash
npx kdf init
```

`npx kdf init` uses the local package binary when `@kondeio/kdf` is already
installed in the project.

## File Structure

```
kdf/
  shared/              <- shared defaults (button, typography, layout, card)
  homepage.json        <- full homepage design
  pricing.json         <- pricing page overrides
```

Typical app structure:

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

Example token:

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

## Class Composition

KDF includes small class composition helpers that work with any UI library:

| Helper | Purpose |
| --- | --- |
| `cn()` | Joins conditional classes, drops falsy values, normalizes whitespace, and removes exact duplicates. |
| `cx()` | Alias of `cn()`. |
| `composeClasses()` | Same default composer with a more explicit name. |
| `dedupeClasses()` | Removes exact duplicates from an existing class string. |
| `createClassComposer({ merge })` | Creates a composer with an app-defined merge step. |

The default behavior is intentionally universal. It normalizes whitespace and
dedupes exact class names, but does not interpret semantic conflicts such as
color, spacing, variant, or framework-specific utility groups.

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

Remove exact duplicates:

```ts
import { dedupeClasses } from "@kondeio/kdf";

dedupeClasses("btn btn btn-primary");
// "btn btn-primary"
```

Add project-specific merge rules:

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
run on the **server only**: Next.js Server Components, Astro server rendering,
Hono handlers, or equivalent Node/server-rendered code. They do **not** work
inside browser-only code or a Next.js Client Component (`"use client"`), which
has no filesystem.

For client components, resolve on the server and pass the resulting className
string down as a prop:

```tsx
// Server Component
const d = getDesign("homepage");
return <ClientThing className={d("hero.cta")} />;
```

## References

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

## `data-kdf`

Every element using `d()` should have matching `data-kdf`:

```tsx
<div data-kdf="hero.wrapper" className={d("hero.wrapper")}>
```

This makes the rendered UI traceable for agent scanning, visual editing, and
Playwright checks.

## Cache Behavior

KDF caches design JSON files by default. In development it revalidates with
file `mtime`/`size` checks so repeated `d()` calls do not create disk-read
storms during HMR.

```tsx
const d = getDesign("homepage", { cache: "auto", maxAgeMs: 250 });
```

Use `clearKdfCache()` for explicit invalidation in custom tooling.

## CSS Custom Properties

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

Generated CSS can live in `konde.css`. The plugin exposes its path via env
(`KDF_CLIENT_CSS`); wire the `<link>`/import in your app (e.g. last in
`globals.css`) — the plugin does not inject it for you.

## Commands

- `kdf init` - scaffold the starter `kdf/` folder and generated CSS files.
- `bun example/preview.ts [tailwind|shadcn|bootstrap|pure-css]` - run the local
  KDF example preview. Use `PORT=4410` to avoid port conflicts and
  `KDF_PREVIEW_OPEN=0` for test/CI runs without opening a browser.

## Next.js Config

Default KDF directory (`./kdf`):

```ts
// next.config.ts
import withKDF from "@kondeio/kdf/plugin";

export default withKDF()(nextConfig);
```

Custom KDF directory (`./my-design`):

```ts
// next.config.ts
import withKDF from "@kondeio/kdf/plugin";

export default withKDF({ dir: "./my-design" })(nextConfig);
```

## Key Symbols

| Symbol | Purpose | Example |
| --- | --- | --- |
| `$` | Component binding | `"$": "Button"` |
| `@` | Shared style reference | `"@button.cta"` |
| `$layout` | Page section order | `["hero", "footer"]` |

## Documentation and Skills

- [`docs/kdf-doc-1.0.md`](./docs/kdf-doc-1.0.md) - KDF concept, architecture, conventions, and release notes.
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
