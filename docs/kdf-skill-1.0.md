# KDF Skill 1.0

Use this skill whenever you build, review, or modify UI that uses Konde Design Framework.

Package: `@kondeio/kdf`
Runtime target: Node/server-side JavaScript. Tested with Next.js, Astro, and Hono.
Primary API: `getDesign`, `cn`, `cx`, `composeClasses`, `dedupeClasses`, `createClassComposer`, `clearKdfCache`
Required convention: every `d()` usage must have matching `data-kdf`

## Goal

Build UI from KDF JSON instead of improvising styles in JSX.

KDF is the design source of truth. Code should render the design. Agents should not invent spacing, colors, typography, or section order when a KDF token exists or should exist.

## Before You Edit

1. Locate the relevant design file:

```text
kdf/<page>.json
kdf/shared/*.json
```

2. Locate the relevant UI component or page.

3. Confirm package import:

```ts
import { getDesign, cn } from "@kondeio/kdf";
```

4. Confirm page accessor:

```ts
const d = getDesign("homepage");
```

5. Confirm the styling framework scans KDF JSON if it generates CSS by scanning source files:

```css
@source "../kdf/**/*.json";
```

or equivalent framework/source scanning config.

## Non-negotiable Rules

### 1. Do Not Guess Design

If a class belongs to the design system, put it in JSON and read it with `d()`.

Wrong:

```tsx
<h1 className="text-5xl font-semibold tracking-tight">
```

Right:

```tsx
<h1 data-kdf="hero.title" className={d("hero.title")}>
```

### 2. Always Add `data-kdf`

Every token usage must be traceable.

Wrong:

```tsx
<h1 className={d("hero.title")}>
```

Right:

```tsx
<h1 data-kdf="hero.title" className={d("hero.title")}>
```

The `data-kdf` value must match the `d()` path.

### 3. Keep Component Logic in Code

KDF controls design, not business logic.

Keep these in code:

- data fetching
- state
- event handlers
- conditional rendering
- permissions
- accessibility behavior
- component implementation

Keep these in KDF JSON:

- classes
- page section order
- visibility via `$layout`
- shared style references
- CSS custom properties
- component design metadata such as `$`, `variant`, and `size`

### 4. Prefer Shared Tokens

If a style repeats across pages, move it into `kdf/shared`.

Example:

```json
{
  "hero": {
    "cta": "@button.cta"
  }
}
```

Avoid copying the same long button class into many page files.

### 5. Use KDF Class Composition

Use `cn()` when combining KDF tokens with conditional classes or caller-provided `className`.

```tsx
className={cn(d("button.base"), active && d("button.active"), className)}
```

Do not concatenate class strings manually when conditional classes can drift or duplicate.

KDF provides universal class helpers:

- `cn()` joins conditional classes, drops falsy values, normalizes whitespace,
  and removes exact duplicate classes.
- `cx()` is an alias of `cn()`.
- `composeClasses()` is the same default composer with a more explicit name.
- `dedupeClasses()` removes exact duplicate class names from an existing string.
- `createClassComposer({ merge })` lets the app inject project-specific class
  rules.

Default KDF composition is semantic-free. It does not resolve color, spacing,
variant, or framework-specific conflicts. If an app needs those rules, define
them at app level:

```ts
import { createClassComposer } from "@kondeio/kdf";

export const cn = createClassComposer({
  merge(className) {
    return applyProjectClassRules(className);
  }
});
```

### 6. Resolve Design Server-Side

`getDesign()` / `d()` / `d.css()` read JSON via Node `fs` — server-only. Never
call them in a Client Component (`"use client"`); the browser has no filesystem.
Resolve in server-rendered code such as a Next.js Server Component, Astro
server render, or Hono server handler, then pass the resulting className string
down to browser/client components as a prop.

```tsx
// Server Component
const d = getDesign("homepage");
return <ClientThing className={d("hero.cta")} />;
```

## JSON Patterns

### String Token

```json
{
  "hero": {
    "wrapper": "mx-auto max-w-6xl px-6 py-20"
  }
}
```

```tsx
<section data-kdf="hero.wrapper" className={d("hero.wrapper")} />
```

### Object Token

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

```tsx
<h1 data-kdf="hero.title" className={d("hero.title")} />
```

### CSS Properties

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

```tsx
<h1
  data-kdf="hero.title"
  className={d("hero.title")}
  style={d.css("hero.title")}
/>
```

## References

Use `@` for shared style references.

```json
{
  "hero": {
    "cta": "@button.cta"
  }
}
```

Extend a shared reference:

```json
{
  "hero": {
    "cta": "@button.cta shadow-xl"
  }
}
```

Use multiple references:

```json
{
  "hero": {
    "login": "@button.base @button.ghost @button.sm"
  }
}
```

## Page Layout

Use `$layout` for section order and visibility.

```json
{
  "$layout": ["hero", "features", "footer"],
  "hero": {},
  "features": {},
  "footer": {}
}
```

Rules:

- render sections in `$layout` order
- hide sections missing from `$layout`
- keep section token data even when hidden if it may be reused later

## Install Behavior

Default install:

```bash
npm install @kondeio/kdf
```

This scaffolds starter `kdf/` through `postinstall` if the folder does not exist.

Opt out:

```bash
npm install @kondeio/kdf --ignore-scripts
```

Manual init:

```bash
npx kdf init
```

Do not document fake custom npm flags such as `--noinit`. Use `--ignore-scripts`.

## Cache Behavior

KDF caches JSON by default.

Development mode revalidates with file `mtimeMs` and `size` checks to avoid disk-read storms during HMR.

Use explicit cache options only when needed:

```ts
const d = getDesign("homepage", {
  cache: "auto",
  maxAgeMs: 250
});
```

Use custom invalidation only for tooling:

```ts
clearKdfCache();
```

## Implementation Checklist

Use this checklist before finishing KDF-related UI work.

- [ ] Page imports `getDesign` from `@kondeio/kdf`.
- [ ] Page creates one accessor per design page, for example `getDesign("homepage")`.
- [ ] Every `d()` usage has matching `data-kdf`.
- [ ] Shared repeated styles live in `kdf/shared`.
- [ ] One-off page styles live in `kdf/<page>.json`.
- [ ] Conditional class composition uses `cn()`, `cx()`, or `composeClasses()`.
- [ ] Exact duplicate class cleanup uses `dedupeClasses()` when operating on an existing class string.
- [ ] App-specific semantic merge rules use `createClassComposer({ merge })`, not hardcoded KDF internals.
- [ ] CSS custom properties use `d.css(path)`.
- [ ] The app's styling framework scans KDF JSON files when required.
- [ ] No large design class strings are hardcoded in JSX when a token should exist.
- [ ] `$layout` is respected if the page uses section ordering.

## Review Checklist

Use this when reviewing code written by another agent.

- [ ] No legacy `@konde/kdf` imports remain; use `@kondeio/kdf`.
- [ ] No element uses `d("...")` without `data-kdf`.
- [ ] `data-kdf` values match the token paths exactly.
- [ ] No design drift through arbitrary inline styling classes.
- [ ] KDF JSON remains valid JSON.
- [ ] Shared refs point to existing shared token files.
- [ ] `@` refs are not used for business logic.
- [ ] `postinstall` behavior is documented as intentional.
- [ ] No non-English or informal comments are introduced into public KDF package source.

## Validation Commands

From the KDF package root:

```bash
bun run build
bun run typecheck
bun run test
npm pack --dry-run --json
```

From the host app:

```bash
bun run build
```

When testing package install behavior:

```bash
npm install ../kondeio-kdf-0.1.0.tgz
npm install ../kondeio-kdf-0.1.0.tgz --ignore-scripts
npx kdf init
```

Expected:

- default install creates starter `kdf/`
- `--ignore-scripts` does not create starter files
- `npx kdf init` can initialize manually later

## Agent Behavior

If a user asks for a KDF UI change:

1. Inspect current JSON.
2. Inspect the rendered component/page.
3. Update JSON first when the change is design-only.
4. Update TSX only when structure, behavior, or data flow changes.
5. Verify `data-kdf` coverage.
6. Run the smallest relevant validation.

If a user asks to publish KDF:

1. Confirm GitHub repo state.
2. Confirm npm account/scope access.
3. Confirm package metadata.
4. Confirm README and license.
5. Run pack dry-run.
6. Install packed tarball into a clean sample.
7. Publish only after explicit approval.

Never publish npm automatically without explicit user instruction.
