# KDF License Decision

Package: `@kondeio/kdf`
License: MIT
Version: 1.0

## Decision

Konde Design Framework uses the MIT License.

## Why MIT

MIT is the right license for KDF because KDF is intended to be adopted broadly as a design-system package and agent-readable design layer.

MIT gives users permission to:

- use KDF in personal projects
- use KDF in commercial projects
- modify KDF
- redistribute KDF
- include KDF in proprietary applications

This matches the goal: reduce friction for developers, agencies, internal teams, and future Konde ecosystem users.

## What MIT Does Not Do

MIT does not require users to open source their application.

MIT does not force improvements to be contributed back.

MIT does not protect the Konde brand or trademark by itself.

MIT does not replace package signing, provenance, or supply-chain security.

## Alternatives Considered

### Apache-2.0

Pros:

- explicit patent grant
- common for infrastructure packages
- more complete legal language

Cons:

- longer and heavier than MIT
- unnecessary for the current KDF adoption goal

Verdict: good license, but more ceremony than KDF needs right now.

### BSD-2-Clause / BSD-3-Clause

Pros:

- permissive
- familiar
- simple

Cons:

- no meaningful advantage over MIT for this package

Verdict: acceptable, but MIT is simpler and more common in the npm ecosystem.

### MPL-2.0

Pros:

- file-level copyleft
- encourages improvements to core files to remain open

Cons:

- more complex for users
- can reduce adoption in commercial app teams
- not ideal for a design-framework package meant to be embedded widely

Verdict: not recommended for KDF.

### GPL / AGPL

Pros:

- strong open-source reciprocity

Cons:

- too restrictive for commercial app adoption
- creates legal friction for companies and agencies
- wrong fit for a design-system utility package

Verdict: not suitable for KDF.

### BUSL / Source-Available

Pros:

- protects commercial infrastructure products
- allows public code without full OSS rights

Cons:

- not true OSS
- sends the wrong signal for an adoption-layer package
- blocks external ecosystem trust

Verdict: not suitable for KDF.

## Business Model Separation

KDF should be open source.

Commercial value should come from products around KDF, not from restricting KDF itself.

Examples:

- Konde Designer: visual editor for KDF JSON
- Konde Studio integration
- hosted marketplace/templates
- paid design packs
- enterprise support

## Repository Requirements

Before public OSS announcement, the dedicated repo should include:

- `LICENSE` with MIT text
- `README.md` with install and usage
- `package.json` with `"license": "MIT"`
- repository URL pointing to `https://github.com/KondeIO/kdf`
- issue URL pointing to `https://github.com/KondeIO/kdf/issues`

## npm Requirements

Before npm publish:

- confirm package name: `@kondeio/kdf`
- confirm npm account/scope access
- confirm `publishConfig.access` is `public`
- run package dry-run
- inspect included files
- install packed tarball into a clean sample app

## Trademark Note

MIT covers code licensing. It does not grant unrestricted rights to use the Konde name, logo, or brand identity.

If needed later, add a separate trademark notice to the repository.
