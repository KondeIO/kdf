# Changelog

All notable changes to KDF are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com); versions follow semver.

## [0.1.1] - 2026-06-22

### Changed
- Documentation now keeps the KDF install flow npm-focused: default install is
  `npm install @kondeio/kdf`, skip scaffolding with `--ignore-scripts` or
  `KDF_SKIP_INIT=1`, and run manual initialization with
  `npm exec -- kdf init`.
- CLI help now shows the npm-based manual initialization command.

## [0.1.0] - 2026-06-18

Initial public release candidate.

### Changed
- **Class composition is now UI-library agnostic.** `cn()` / `cx()` /
  `composeClasses()` normalize and dedupe exact duplicate classes by default,
  while `createClassComposer({ merge })` allows app-defined semantic merge
  rules without adding framework-specific runtime dependencies to KDF.
- Package scope renamed `@konde/kdf` → `@kondeio/kdf`.
- `package.json` description clarified: KDF is a Node/server-side package with
  an optional Next.js plugin and UI-library agnostic class composition.

### Added
- `dedupeClasses()`, `composeClasses()`, `cx()`, and
  `createClassComposer({ merge })`.
- Documented the **server-only** constraint (resolver uses Node `fs`) across
  README, `docs/kdf-doc.md`, and `docs/kdf-skill.md`, with the
  resolve-on-server / pass-className-as-prop pattern.
- `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`.

### Fixed
- `@ref` component names are validated against `^[A-Za-z0-9_-]+$` — path-traversal
  references (`..`, separators) are rejected instead of resolving to arbitrary
  `.json` files.
- Corrected the plugin "auto-inject CSS" claim: `withKDF()` only exposes paths
  via env (`KDF_DIR`, `KDF_SERVER_CSS`, `KDF_CLIENT_CSS`); the host app wires the
  stylesheet.
