# Security Policy

## Reporting a vulnerability

Please report security issues **privately** — do not open a public GitHub issue.

Email: **security@konde.io** (or open a private security advisory on the
GitHub repository).

Include a description, affected version, and a minimal reproduction if possible.
We aim to acknowledge reports within a few business days.

## Install-time behavior (`postinstall`)

KDF runs a `postinstall` script that **scaffolds a starter `kdf/` folder** into
the consuming project so the package works out of the box. You should know
exactly what it does:

- **What it writes:** a `kdf/` folder at the project root (`INIT_CWD`) containing
  starter design JSON (`shared/*.json`, `homepage.json`) and generated CSS files
  (`konde-server.css`, `konde.css`).
- **What it never does:** it never overwrites an existing `kdf/` folder, never
  touches files outside `kdf/`, makes no network calls, and reads/writes no
  secrets or credentials.
- **When it is skipped:** it does nothing if `kdf/` already exists.

### Opting out

```bash
# Skip all install scripts (npm):
npm install @kondeio/kdf --ignore-scripts

# Or disable just KDF scaffolding:
KDF_SKIP_INIT=1 npm install @kondeio/kdf
```

You can scaffold manually later with:

```bash
npm exec -- kdf init
```

## Reference resolution safety

`@ref` component names (e.g. `@button.cta` → `shared/button.json`) are validated
against `^[A-Za-z0-9_-]+$`. References containing path separators or `..` are
rejected, so a ref cannot read files outside the `shared/` folder. Design JSON is
authored by developers (trusted input); this is defense-in-depth.

## Supported versions

KDF is pre-1.0 (`0.x`). Security fixes target the latest published `0.x`
release.
