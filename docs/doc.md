# Konde Design Framework

Package: `@kondeio/kdf`
License: MIT

Konde Design Framework, or KDF, is a JSON-based design coordination layer for
Node/server-side web apps and agent-assisted UI work.

KDF does for design consistency what i18n does for translation consistency:
move repeatable UI decisions out of scattered component files and into a stable
source of truth that both users and agents can read.

## Goal

Design control and consistency through JSON as the shared language between users
and agents.

- Users own design direction and approval.
- Users can edit JSON directly when they want precise control.
- Agents read KDF JSON and implement UI from it.
- Code renders the approved design.
- `data-kdf` maps DOM elements back to exact JSON paths.
- One source of truth keeps every page, component, and agent session consistent.

KDF should reduce chat iteration, not create a new design bureaucracy.

## The Problem

Without KDF, classes live across many `.tsx` files:

```tsx
<section className="mx-auto max-w-6xl px-6 py-20">
  <h1 className="text-5xl font-semibold tracking-tight">
```

That works for a single human editor, but it is fragile for agentic work:

- agents improvise colors, spacing, typography, and layout
- users correct the result through chat
- every page drifts slightly
- changes require searching component files
- repeated sessions lose design intent

The result is endless "bigger", "more blue", "move left" iteration.

## The Solution

KDF makes design explicit:

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

The rendered UI still uses normal CSS. The difference is ownership:

- JSON defines the design.
- Code renders the design.
- Agents implement from JSON instead of guessing.
- Users adjust JSON instead of describing visual corrections repeatedly.

## Why Not Just a Design Library?

A design library says:

```text
This is a Button.
```

KDF says:

```text
This is homepage.hero.cta-primary, rendered as a Button, styled with this token.
```

| Approach | What it says | Mapping |
| --- | --- | --- |
| Design library | "This is a Button" | Generic component, many possible overrides |
| KDF | "This is `hero.cta-primary` on `homepage`" | One element maps to one design key |

Design libraries provide component primitives. They do not always enforce which
style belongs to which element on which page. KDF adds that missing mapping.

```text
Design library:
  Button component -> generic styles
                   -> used in many places
                   -> every developer or agent can override differently
                   -> no exact map from element to design decision

KDF:
  data-kdf="hero.cta-primary" -> d("hero.cta-primary") -> one JSON key
                               -> one element, one design token
                               -> scanner and agent can find the source
```

KDF is not a replacement for a component library. It can sit above shadcn,
Bootstrap, Chakra, plain CSS, Tailwind, or a custom design system.

## What KDF Does

KDF translates repeated design decisions from component files into JSON.

```text
i18n:
  hardcoded text in JSX -> language keys in JSON -> t("hero.headline")

KDF:
  hardcoded classes in JSX -> design tokens in JSON -> d("hero.title")
```

KDF stores:

- class names
- shared style references
- page section order
- CSS custom properties
- optional component identity metadata

KDF does not store:

- business logic
- event handlers
- data fetching
- permissions
- accessibility behavior
- component implementation

## Architecture

Design tokens live in two places:

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

| File | Role |
| --- | --- |
| `kdf/shared/*.json` | reusable component and style defaults |
| `kdf/<page>.json` | page-specific composition and overrides |
| `kdf/konde-server.css` | critical first-paint CSS overrides |
| `kdf/konde.css` | non-critical user CSS overrides |

Symbols:

| Symbol | Meaning | Example |
| --- | --- | --- |
| `$` | component identity metadata | `"$": "Button"` |
| `className` | rendered class string | `"@button.cta shadow-xl"` |
| `@` | shared style reference | `"@button.cta"` |
| `$layout` | page section order and visibility | `["hero", "footer"]` |
| `css` | CSS custom properties | `{ "--kdf-accent": "#4F46E5" }` |

`$` is metadata for agents and host tooling. The runtime accessor `d(path)`
returns the resolved `className`, and `d.css(path)` returns the `css` object.

## JSON Token Forms

### Class string

Use a string when a token only needs classes:

```json
{
  "hero": {
    "wrapper": "flex flex-col gap-8 lg:flex-row"
  }
}
```

```tsx
<section data-kdf="hero.wrapper" className={d("hero.wrapper")} />
```

### Object token

Use an object when the token needs metadata, classes, or CSS custom properties:

```json
{
  "hero": {
    "title": {
      "$": "h1",
      "className": "@typography.h1"
    },
    "cta-primary": {
      "$": "Button",
      "className": "@button.cta"
    }
  }
}
```

### CSS custom properties

Use `css` when values should be applied as inline style variables:

```json
{
  "hero": {
    "title": {
      "className": "text-3xl",
      "css": {
        "--kdf-accent": "#4F46E5"
      }
    }
  }
}
```

```tsx
<h1
  data-kdf="hero.title"
  className={d("hero.title")}
  style={d.css("hero.title")}
/>
```

## Shared References

Shared references are written with `@`:

```json
{
  "hero": {
    "cta-primary": "@button.cta",
    "cta-large": "@button.cta text-lg shadow-xl"
  }
}
```

`@button.cta` resolves from:

```text
kdf/shared/button.json -> cta
```

References can chain through other references. Resolution stops after a small
depth limit to avoid loops.

The component segment is validated. A ref like `@../../secret.value` is rejected
instead of escaping the `shared/` directory.

## Multi-Level Shared Tokens

KDF supports a shared-token cascade for apps with multiple design directories.

```text
designs/
  shared/
    button.json          <- fallback for all templates
    typography.json
  lander/
    shared/
      button.json        <- lander-only override
    homepage.json
  newlander/
    homepage.json        <- uses root shared fallback
```

Resolution order for `@button.cta`:

1. `<KDF_DIR>/shared/button.json`
2. `<KDF_DIR>/../shared/button.json`
3. current page tokens

This means a template can override only the parts it needs and inherit the rest.

## Multi-Template Design

Like i18n can switch languages, KDF can switch design templates.

```text
languages/en/       -> designs/lander/
languages/id/       -> designs/newlander/
activate language      activate design template
```

```text
designs/
  lander/
    shared/
    homepage.json
  newlander/
    shared/
    homepage.json
```

Same app, same components, same code. Point `KDF_DIR` to another design folder:

```ts
export default withKDF({ dir: "./designs/lander" })(nextConfig);
```

Switching templates should be a deliberate host-app decision. KDF provides the
folder model and resolver behavior.

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

- sections listed in `$layout` render
- sections missing from `$layout` are hidden by the host app
- section order follows array order
- section token data can remain even when a section is hidden

The application still decides how to render sections. KDF provides the design
and order data.

## Why Nested Structure Matters

JSON nesting is functional, not just tidy.

1. `$layout` uses top-level section keys for page order and visibility.
2. Dot paths scope repeated names like `hero.title` and `footer.title`.
3. `data-kdf` maps DOM nodes directly to JSON paths.
4. Agents and scanners can locate the exact design source for an element.
5. One section can be replaced without rewriting unrelated tokens.

Nested JSON turns page structure into data.

## `data-kdf`

Every element using a KDF token must include the matching `data-kdf` path:

```tsx
<h1 data-kdf="hero.title" className={d("hero.title")}>
```

This enables:

- DOM to JSON path mapping
- Playwright assertions
- scanner validation
- agent review
- visual tooling that targets the exact design token

If an element uses `d("hero.title")` but lacks
`data-kdf="hero.title"`, treat it as invalid KDF usage.

## Konde CSS Override Files

KDF creates two CSS files during initialization. Both are user-owned. KDF never
overwrites them after creation.

| File | Intended loading | Purpose |
| --- | --- | --- |
| `konde-server.css` | imported by the app for first paint | critical CSS variables and no-FOUC overrides |
| `konde.css` | loaded after framework/app CSS | non-critical tweaks, experiments, escape hatches |

Examples:

```css
/* konde-server.css */
:root { --kdf-primary: #4F46E5; }
[data-kdf="hero.slider"] { display: none; }
```

```css
/* konde.css */
[data-kdf="hero.title"] { letter-spacing: -0.02em; }
[data-kdf="hero.wrapper"] { gap: 3rem; }
```

The Next.js plugin exposes paths through environment values. It does not inject
CSS automatically. The host app wires imports or links explicitly.

## Color Definitions

KDF JSON stores class names, not CSS engine internals. Color tokens can point to
whatever the host styling system understands.

Tailwind:

```json
{
  "primary-text": "text-[#4F46E5]",
  "brand-bg": "bg-[var(--kdf-primary)]"
}
```

Bootstrap:

```json
{
  "primary-text": "text-primary",
  "cta": "btn btn-primary"
}
```

Plain CSS:

```json
{
  "primary-text": "kdf-text-primary"
}
```

CSS variables belong in app CSS:

```css
:root { --kdf-primary: #4F46E5; }
```

Then JSON can reference them through framework-compatible classes:

```json
{
  "title": "text-[var(--kdf-primary)]"
}
```

## CSS Framework Scanning

If a styling framework generates CSS by scanning source files, make it scan KDF
JSON files too. Otherwise classes stored in JSON may not be generated.

Tailwind v4:

```css
@import "tailwindcss";
@source "../kdf/**/*.json";
```

Tailwind v3:

```ts
export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "./kdf/**/*.json"
  ]
};
```

## Runtime API

KDF core runs in Node/server-side JavaScript because it reads JSON from disk.

```ts
import { getDesign, cn, clearKdfCache } from "@kondeio/kdf";

const d = getDesign("homepage");
```

Accessor behavior:

```ts
d("hero.title");      // resolved className string
d.css("hero.title");  // CSS custom properties object
```

Server-only rule:

- use `getDesign()` in server-rendered code
- do not call it directly inside browser-only Client Components
- resolve classes server-side and pass strings down when needed

Cache options:

```ts
const d = getDesign("homepage", {
  cache: "auto",
  maxAgeMs: 250
});
```

Cache modes:

```text
auto    production caches forever; development revalidates by mtime/size
always  cache for the lifetime of the process
none    bypass cache
```

Use `clearKdfCache()` for explicit invalidation in custom tooling.

## Class Composition

KDF includes small class composition helpers:

```ts
import { cn, cx, composeClasses, dedupeClasses, createClassComposer } from "@kondeio/kdf";
```

Use `cn()` when combining KDF tokens with conditional classes:

```tsx
className={cn(d("button.base"), active && d("button.active"), className)}
```

Helpers:

- `cn()` joins conditional class values, drops falsy values, normalizes
  whitespace, and removes exact duplicate classes.
- `cx()` is an alias of `cn()`.
- `composeClasses()` is the same default composer with an explicit name.
- `dedupeClasses()` removes exact duplicates from an existing class string.
- `createClassComposer({ merge })` creates a composer with an app-defined merge
  step.

KDF intentionally does not understand semantic utility conflicts. Apps that
need Tailwind-specific or project-specific merging can inject their own rules.

## UI Library Compatibility

KDF is UI-library agnostic because it stores design tokens and metadata, not
component implementations.

shadcn-style metadata:

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
    "className": "my-btn my-btn--primary"
  }
}
```

KDF gives the host app stable design data. The host app still owns actual
component rendering.

## Full Page Layout Example

KDF can describe a complete page structure:

```json
{
  "$layout": ["hero", "section-a", "footer"],
  "page": {
    "wrapper": "flex min-h-screen"
  },
  "hero": {
    "wrapper": "flex flex-col gap-8 lg:flex-row lg:items-center",
    "image-wrapper": "w-full lg:w-1/2 order-1",
    "content": "w-full lg:w-1/2 order-2",
    "title": "@typography.h1",
    "description": "mt-4 @typography.body",
    "actions": "mt-6 flex gap-3",
    "cta-primary": "@button.base @button.cta @button.md",
    "cta-secondary": "@button.base @button.outline @button.md"
  },
  "section-a": {
    "wrapper": "mt-16 border-t pt-16",
    "title": "@typography.h2",
    "content": "mt-4 @typography.body max-w-2xl"
  },
  "footer": {
    "wrapper": "mt-16 border-t py-8",
    "nav": "flex flex-wrap gap-6 justify-center",
    "nav-item": "text-sm text-gray-500 hover:text-gray-700"
  }
}
```

Design changes that can happen in JSON:

- hide `section-a` by removing it from `$layout`
- reorder page sections by changing `$layout`
- swap hero image/content order with classes
- change CTA style through shared `button.json`

## Installation

Install the package:

```bash
npm install @kondeio/kdf
pnpm add @kondeio/kdf
bun add @kondeio/kdf
```

The install initializer creates starter files only when the target `kdf/`
folder does not already exist. Existing files are never overwritten.

Manual initialization:

```bash
npm exec -- kdf init
```

Custom design directory:

```bash
KDF_DIR=./designs npm exec -- kdf init
```

Next.js config:

```ts
import withKDF from "@kondeio/kdf/plugin";

export default withKDF({ dir: "./designs" })(nextConfig);
```

## License

KDF uses MIT. The root `LICENSE` file is the source of truth.
