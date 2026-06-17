# Changelog

All notable changes to KDF are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com); versions follow semver.

## [Unreleased]

### Changed
- **`cn()` is now `clsx`-only.** Removed the `tailwind-merge` runtime dependency
  to keep the core UI-library agnostic. Consumers who want Tailwind conflict
  resolution wrap `cn()` with `tailwind-merge` in their own app (see README).
- Package scope renamed `@konde/kdf` → `@kondeio/kdf`.
- `package.json` description broadened: framework-agnostic core, first-class
  Next.js plugin.

### Added
- Documented the **server-only** constraint (resolver uses Node `fs`) across
  README, `docs/kdf-doc-1.0.md`, and `docs/kdf-skill-1.0.md`, with the
  resolve-on-server / pass-className-as-prop pattern.
- `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`.

### Fixed
- `@ref` component names are validated against `^[A-Za-z0-9_-]+$` — path-traversal
  references (`..`, separators) are rejected instead of resolving to arbitrary
  `.json` files.
- Corrected the plugin "auto-inject CSS" claim: `withKDF()` only exposes paths
  via env (`KDF_DIR`, `KDF_SERVER_CSS`, `KDF_CLIENT_CSS`); the host app wires the
  stylesheet.

## [0.1.0]

- Initial KDF package: `getDesign()` accessor, `@`-reference resolution, dev
  cache with `mtimeMs`/`size` revalidation, `withKDF()` Next.js plugin, starter
  scaffolding.
