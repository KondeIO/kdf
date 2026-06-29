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

KDF has two runtime modes:

- `createDesign(tokens, shared)` uses JSON objects imported by the host app.
  This is the preferred mode for Astro, Next.js, Hono, Cloudflare Workers, and
  other edge/serverless runtimes because bundlers can see and include the JSON.
- `getDesign(page)` reads `kdf/<page>.json` from disk with Node `fs`. This is
  convenient for Node/server apps and local tooling, but it is not the right
  API for edge runtimes that do not have your local filesystem.

- Works with server-rendered Next.js, Astro, Hono, Cloudflare Workers, or similar runtimes.
- The included `@kondeio/kdf/plugin` export is the official Next.js integration.
- Next.js plugin target: App Router, Next.js 14+ (`next >=14`).
- `getDesign()` is server-only. Browser/client components should use resolved
  class strings from a server boundary or use imported JSON with `createDesign()`
  when the bundler/runtime supports it.

| Framework | Status | How KDF is used |
| --- | --- | --- |
| Next.js | Tested | `createDesign()` with imported JSON, or `getDesign()` in Node/server-rendered code plus the optional plugin. |
| Astro | Tested | `createDesign()` with imported JSON for SSR/edge builds. |
| Hono | Tested | `createDesign()` with imported JSON in handlers, or `getDesign()` in Node handlers. |
| Cloudflare Workers | Supported | `createDesign()` with imported JSON. Do not pass local absolute file paths. |

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
npm exec -- kdf init
```

`npm exec -- kdf init` uses the local package binary when `@kondeio/kdf` is already
installed in the project.

Initialize a custom design directory:

```bash
KDF_DIR=./designs npm exec -- kdf init
```

## File Structure

```
kdf/
  shared/              <- shared defaults (button, typography, layout, card)
  homepage.json        <- starter page design
  konde-server.css     <- critical project overrides
  konde.css            <- non-critical project overrides
```

The package repository also keeps additional page JSON examples under
`example/sample-pages/`. They are reference material only and are not copied by
`postinstall` or `kdf init`.

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
    konde-server.css
    konde.css
  next.config.ts
```

## Custom Design Directory

The default design directory is `./kdf`.

Use `./designs` or `./design` through `KDF_DIR` in any Node/server-side runtime:

```bash
KDF_DIR=./designs npm run dev
```

```tsx
import { getDesign } from "@kondeio/kdf";

const d = getDesign("homepage");
```

In Next.js, the optional plugin sets `KDF_DIR` for the app:

```ts
// next.config.ts
import withKDF from "@kondeio/kdf/plugin";

export default withKDF({ dir: "./designs" })(nextConfig);
```

With that config, KDF reads:

```text
designs/
  shared/
  homepage.json
  konde-server.css
  konde.css
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

### Imported JSON API

Use `createDesign()` when the app is bundled for Astro, Next.js, Hono, or
Cloudflare Workers:

```tsx
import { createDesign } from "@kondeio/kdf";
import homepageTokens from "../kdf/homepage.json";
import buttonTokens from "../kdf/shared/button.json";
import typographyTokens from "../kdf/shared/typography.json";

const d = createDesign(homepageTokens, {
  button: buttonTokens,
  typography: typographyTokens,
});

<h1 data-kdf="hero.title" className={d("hero.title")}>
  {t("hero.headline")}
</h1>
```

This makes the JSON a normal build dependency. The bundler includes it in the
output instead of KDF trying to read a machine-local path at runtime.

If a runtime or bundler rejects Node built-ins entirely, import the pure entry:

```ts
import { createDesign } from "@kondeio/kdf/edge";
```

### File API

Use `getDesign()` in Node/server environments where reading from `kdf/*.json` at
runtime is intentional:

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

`getDesign()` reads JSON from disk via Node `fs`, so it runs on the **server
only**: Next.js Server Components, Astro Node server rendering, Hono Node
handlers, or equivalent Node/server-rendered code. It does **not** work inside
browser-only code or a Next.js Client Component (`"use client"`), which has no
filesystem.

For client components, resolve on the server and pass the resulting className
string down as a prop:

```tsx
// Server Component
const d = getDesign("homepage");
return <ClientThing className={d("hero.cta")} />;
```

For edge/serverless deploys, prefer `createDesign(importedJson, shared)` so the
tokens are bundled as code/data instead of looked up from a runtime path.

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

`getDesign()` caches design JSON files by default. In development it revalidates
with file `mtime`/`size` checks so repeated `d()` calls do not create disk-read
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

- [`docs/doc.md`](./docs/doc.md) - KDF concept, architecture, conventions, and operating model.
- [`docs/skill.md`](./docs/skill.md) - agent-facing implementation and review checklist.

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

MIT. See [`LICENSE`](./LICENSE) for the full license text.
