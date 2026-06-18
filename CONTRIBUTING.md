# Contributing to KDF

Thanks for your interest in improving the Konde Design Framework.

## Local setup

KDF builds with [Bun](https://bun.sh) (Node 18+ also works for running `dist`).

```bash
git clone https://github.com/KondeIO/kdf.git
cd kdf
bun install
```

## Build & verify

```bash
bun run build       # tsc -> dist/
bun run typecheck   # tsc --noEmit
bun run test        # unit tests
```

A change is ready for review when `typecheck` and `test` pass and `dist/` has
been rebuilt (the published artifact lives in `dist/`).

## Project layout

```
src/         TypeScript source (authoritative)
dist/        Build output (tsc) — published to npm
kdf/         Starter design tokens shipped to consumers
example/     Reference usage
docs/        Concept, agent skill, and license docs
```

## Pull requests

- Branch off `main`; keep PRs focused on one change.
- Keep the core **UI-library agnostic** — do not add framework-specific runtime
  dependencies. Class conflict rules belong in app-level
  `createClassComposer({ merge })` integrations.
- The resolver is **server-only** (Node `fs`). Do not introduce browser/DOM
  assumptions into `src/resolver.ts`.
- Update `CHANGELOG.md` under `## Unreleased`.
- Run `bun run build` before committing so `src` and `dist` stay in sync.

## Conventions

- ESM only; internal imports use explicit `.js` extensions (`./resolver.js`).
- Match the existing code style (no new formatter configs in a PR).
- Add or update docs in `docs/` when behavior changes.

## Reporting bugs

Open an issue at https://github.com/KondeIO/kdf/issues with a minimal repro.
For security issues, see [SECURITY.md](./SECURITY.md) — do **not** open a public
issue.
