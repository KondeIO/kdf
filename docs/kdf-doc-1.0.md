# Konde Design Framework 1.0

Document version: 1.0
Package version: 0.1.0
Package: `@kondeio/kdf`
Repository: `https://github.com/KondeIO/kdf`
License: MIT
Status: private GitHub repo prepared, npm publish deferred

## Positioning

Konde Design Framework, or KDF, is a JSON-based design system for Next.js and agent-assisted UI work.

One sentence:

```text
KDF does for design consistency what i18n does for translation consistency.
```

KDF moves page and component styling out of scattered JSX and into JSON files that humans and agents can both read. The user controls the design by editing JSON. The agent implements UI by reading JSON instead of guessing spacing, colors, typography, and layout.

KDF is not a component library and not a CSS engine. It is a design coordination layer over normal CSS, CSS modules, utility CSS, Bootstrap, shadcn, or any other class-based styling system.

## README vs This Document

The package `README.md` should stay concise and technical:

- install command
- minimal folder structure
- basic `getDesign()` usage
- config snippet
- key API notes
- license

This document is the longer source of truth for the concept, conventions, operating model, and agent behavior.

## Problem

Without KDF, classes live across many `.tsx` files:

```tsx
<section className="mx-auto max-w-6xl px-6 py-20">
  <h1 className="text-5xl font-semibold tracking-tight">
```

That works for humans, but it is fragile for agentic work:

- agents guess design details
- users correct by chat
- each page drifts slightly
- changes require searching code
- repeated sessions lose design intent

KDF makes the design explicit:

```json
{
  "hero": {
    "wrapper": "mx-auto max-w-6xl px-6 py-20",
    "title": "text-5xl font-semibold tracking-tight"
  }
}
```

```tsx
const d = getDesign("homepage");

<section data-kdf="hero.wrapper" className={d("hero.wrapper")}>
  <h1 data-kdf="hero.title" className={d("hero.title")}>
```

The class still renders as normal CSS. The difference is the source of truth.

## Core Philosophy

- User controls design.
- Agent reads design.
- JSON is the shared language.
- Code renders the UI.
- `data-kdf` maps DOM elements back to exact JSON paths.
- KDF should reduce chat iteration, not create a new design bureaucracy.

## Package Identity

The public package name is:

```text
@kondeio/kdf
```

The package exports:

```ts
import { getDesign, cn, clearKdfCache } from "@kondeio/kdf";
import withKDF from "@kondeio/kdf/plugin";
```

The CLI binary is available as:

```bash
kdf init
npx kdf init
npx @kondeio/kdf init
```

## Installation

Default install is one-command onboarding:

```bash
npm install @kondeio/kdf
pnpm add @kondeio/kdf
bun add @kondeio/kdf
```

The package uses `postinstall` to scaffold a starter `kdf/` folder if one does not already exist.

The initializer is safe:

- it never overwrites an existing `kdf/` folder
- it creates only starter design files
- it can be skipped with install-script opt-out

Script-free install:

```bash
npm install @kondeio/kdf --ignore-scripts
```

Manual initialization later:

```bash
npx kdf init
```

`npx kdf init` uses the local package binary when `@kondeio/kdf` is already installed.

## Generated Starter Structure

Default init creates:

```text
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
```

The npm package intentionally includes:

```json
{
  "files": ["dist", "kdf", "example"]
}
```

The package should not include local `node_modules`, local tarballs, or OS noise like `.DS_Store`.

## Configuration

Next.js config:

```ts
// next.config.ts
import withKDF from "@kondeio/kdf/plugin";

export default withKDF()(nextConfig);
```

Custom design directory:

```ts
export default withKDF({ dir: "./my-design" })(nextConfig);
```

Absolute design directory is supported through `KDF_DIR` and resolver options in the current implementation.

## CSS Framework Scanning

If your styling framework generates CSS by scanning source files, make sure it scans KDF JSON files too. Otherwise class names stored in JSON may not be generated.

Example for Tailwind v4:

```css
@import "tailwindcss";
@source "../kdf/**/*.json";
```

Example for Tailwind v3:

```ts
export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "./kdf/**/*.json"
  ]
};
```

## JSON Model

KDF supports three practical token forms.

### String Token

Use when a path only needs a class string:

```json
{
  "hero": {
    "wrapper": "flex flex-col gap-8 lg:flex-row"
  }
}
```

Usage:

```tsx
<section data-kdf="hero.wrapper" className={d("hero.wrapper")} />
```

### Object Token

Use when a token needs className plus metadata:

```json
{
  "hero": {
    "title": {
      "$": "h1",
      "className": "@typography.h1"
    }
  }
}
```

### CSS Custom Properties

Use the `css` object for values not practical as class names:

```json
{
  "hero": {
    "title": {
      "className": "text-3xl",
      "css": {
        "--kdf-accent": "oklch(0.546 0.245 262)"
      }
    }
  }
}
```

Usage:

```tsx
<h1
  data-kdf="hero.title"
  className={d("hero.title")}
  style={d.css("hero.title")}
/>
```

## Symbols

| Symbol | Meaning | Example |
|--------|---------|---------|
| `$` | Component identity | `"$": "Button"` |
| `@` | Shared style reference | `"@button.cta"` |
| `$layout` | Page section order and visibility | `["hero", "features", "footer"]` |

`$` answers what to render.

`@` answers where styling comes from.

`$layout` answers which sections appear and in what order.

## Reference Resolution

Shared references are written with `@`:

```json
{
  "hero": {
    "cta": "@button.cta"
  }
}
```

This resolves from:

```text
kdf/shared/button.json -> cta
```

### Resolution cascade

A `@component.key` ref is resolved in this order, first match wins:

1. **Template shared** — `<KDF_DIR>/shared/<component>.json` → `key`
2. **Root shared** — `<KDF_DIR>/../shared/<component>.json` → `key`
   (one level above `KDF_DIR`; the monorepo convention where multiple templates
   share one `shared/`, e.g. `designs/shared/` above `designs/lander/`). For a
   standalone consumer with `kdf/` at the project root this points outside the
   project and is simply skipped.
3. **Page tokens** — the current page JSON itself (`refPart` lookup).

The `<component>` segment is validated against `^[A-Za-z0-9_-]+$`; refs with path
separators or `..` are rejected (no traversal outside `shared/`). `@refs` resolve
recursively up to depth 5.

References can be extended:

```json
{
  "hero": {
    "cta": "@button.cta shadow-xl text-lg"
  }
}
```

Multiple references are supported:

```json
{
  "hero": {
    "login": "@button.base @button.ghost @button.sm"
  }
}
```

## Page Layout

`$layout` controls section order and visibility:

```json
{
  "$layout": ["hero", "features", "footer"],
  "hero": {},
  "features": {},
  "footer": {}
}
```

Rules:

- section listed in `$layout` renders
- section removed from `$layout` is hidden
- section order follows array order
- section data can exist even if hidden

The application still decides how to render sections. KDF provides the design and order data.

## `data-kdf`

Every element using a KDF token must include the matching `data-kdf` path:

```tsx
<h1 data-kdf="hero.title" className={d("hero.title")}>
```

This is mandatory for agent and tooling workflows because it allows:

- DOM to JSON path mapping
- Playwright assertions
- visual editor targeting
- scanner validation
- future Konde Designer editing

If an element uses `d("hero.title")` but lacks `data-kdf="hero.title"`, it should be treated as invalid KDF usage.

## Runtime API

> **Server-only.** `getDesign()`, `d()`, and `d.css()` read JSON from disk via
> Node `fs`. Use them in Server Components / server render (Next.js RSC, Astro).
> They do not run in a Client Component (`"use client"`) — resolve on the server
> and pass the className string down as a prop.

### `getDesign(page, options?)`

```ts
const d = getDesign("homepage");
```

Returns a design accessor:

```ts
d("hero.title");      // className string
d.css("hero.title");  // CSS custom properties object
```

Cache options:

```ts
const d = getDesign("homepage", {
  cache: "auto",
  maxAgeMs: 250
});
```

Cache modes:

```text
auto    default behavior
always  use cache aggressively
none    bypass cache
```

### `clearKdfCache()`

```ts
clearKdfCache();
```

Use this for explicit invalidation in custom tooling or live editors.

### Class Composition

```ts
import {
  cn,
  cx,
  composeClasses,
  createClassComposer,
  dedupeClasses
} from "@kondeio/kdf";

className={cn(d("button.base"), isActive && d("button.active"), className)}
```

KDF ships a small, UI-library agnostic class composition layer:

- `cn()` joins conditional class values, drops falsy values, normalizes
  whitespace, and removes exact duplicate classes.
- `cx()` is an alias of `cn()`.
- `composeClasses()` is the same default composer with a more explicit name.
- `dedupeClasses()` removes exact duplicates from an existing class string.
- `createClassComposer({ merge })` creates a composer with an app-defined merge
  step.

Default behavior is semantic-free. KDF does not try to understand colors,
spacing, variants, framework utility groups, or component-library conventions.
It only turns repeated exact classes into one stable class:

```ts
dedupeClasses("btn btn btn-primary");
// "btn btn-primary"
```

If an app needs project-specific conflict resolution, inject that logic:

```ts
import { createClassComposer } from "@kondeio/kdf";

export const cn = createClassComposer({
  merge(className) {
    return applyProjectClassRules(className);
  }
});
```

This keeps KDF neutral while still allowing each app to enforce its own class
rules.

## Cache Behavior

KDF caches design JSON by default.

In development, KDF revalidates with file `mtimeMs` and `size` checks so repeated `d()` calls do not create disk-read storms during HMR.

Default dev cache window:

```text
250ms
```

Environment override:

```bash
KDF_CACHE_MAX_AGE_MS=500
```

This was added after the website dev server hit repeated file reads through symlinked KDF usage.

## ESM and Dependencies

KDF is ESM:

```json
{
  "type": "module"
}
```

Internal TypeScript source imports must emit Node-compatible ESM paths with `.js` extensions:

```ts
import { loadFile } from "./resolver.js";
```

The package depends on:

```json
{
  "clsx": "^2.1.1"
}
```

`clsx` must remain a real dependency (not peer-only) because KDF's class
composition helpers use it at runtime. KDF intentionally does **not** depend on
framework-specific class merge packages. Semantic conflict resolution is opt-in
per consumer through `createClassComposer({ merge })`.

## UI Library Compatibility

KDF is UI-library agnostic because it stores classes and metadata, not component implementations.

shadcn:

```json
{
  "cta": {
    "$": "Button",
    "variant": "default",
    "className": "@button.cta"
  }
}
```

Bootstrap:

```json
{
  "cta": {
    "$": "button",
    "className": "btn btn-primary btn-lg"
  }
}
```

Plain CSS:

```json
{
  "cta": {
    "$": "button",
    "className": "btn btn-primary"
  }
}
```

## Relationship to Component Libraries

A component library says:

```text
This is a Button.
```

KDF says:

```text
This is homepage.hero.cta-primary, rendered as Button, styled with @button.cta.
```

The difference is specificity. KDF maps a real screen element to a stable design key.

## Multi-template Direction

KDF can support multiple design directories by pointing config or environment to a different directory:

```text
designs/
  lander/
    shared/
    homepage.json
  newlander/
    shared/
    homepage.json
```

Same app, same components, different design JSON.

This is a direction for KDF usage and tooling. The current package foundation supports custom directories and absolute `KDF_DIR`; product-level template switching should be implemented intentionally by the host app.

## Konde Designer Direction

Konde Designer is the future paid visual editor for KDF JSON.

Expected flow:

1. User clicks an element in the rendered app.
2. Tool reads `data-kdf`.
3. Tool opens the corresponding JSON path.
4. User changes token values.
5. App preview updates.

KDF remains OSS. Konde Designer can be commercial.

## Release State

Current private release state:

- KS monorepo contains the source at `/Volumes/CLOUD/server/kdf`.
- Dedicated GitHub repo is `https://github.com/KondeIO/kdf`.
- Private repo initial commit is `7f5521f chore: initial KDF package`.
- npm package is not published yet.

Before npm publish:

- decide long-term `dist/` policy
- add CI for build/typecheck/test
- document release process
- run clean package install test
- run packed tarball test in a sample app
- verify package page rendering after publish

## Recommended Repo Policy

During private review, tracking `dist/` is acceptable because it makes GitHub direct installs easier.

For public OSS, the preferred long-term model is:

- source is authoritative
- CI builds before publish
- npm package includes `dist`
- repo may avoid committed build output unless GitHub direct install is required

This remains an open decision.

## License Decision

KDF uses MIT.

Reason:

- low adoption friction
- compatible with commercial projects
- familiar to npm users
- simple for external contributors

See `license.md` for the license rationale and alternatives.
