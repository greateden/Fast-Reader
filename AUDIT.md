# Final audit — 6 November 2026

## Scope and result

The owner confirmed that FastReader is the intended project and requested a
public archive named `greateden/Fast-Reader`. The starting folder had no `.git`
directory, remote, or recoverable Git history. The archival commit therefore
records the supplied snapshot, not the project's development history.

This is an Electron RSVP reading prototype. Inspection found no experiment
protocol, evaluation dataset, participant records, result tables, or restoration
algorithms. No claims about better comprehension, faster reading, or research
validation can be supported from these files. No new research was conducted.

## Changes

- Replaced the README with plain-English setup, use, implementation, privacy,
  limitations, and evidence boundaries. Corrected the speech and ORP descriptions.
- Kept all application source and reading/timing algorithms unchanged.
- Set electron-builder output to `release/`, outside the `dist/**/*` input.
  Previously, a packaged app in `dist/mac-arm64` could become input to a later
  package. This configuration correction was inspected; packaging was not run.
- Added six deterministic tests without new dependencies.
- Added the MIT licence already declared by `package.json`.
- Excluded local reading material and package output from version control.

The original folder had 1,152,662,273 bytes of regular-file content, mostly
installed dependencies and an old macOS app. A full private tar backup was made
before changes. Its 7,327 regular-file/symlink entries were checked against the
original SHA-256/link manifest. The backup and its manifest remain outside the
project and are not published.

## What is preserved and published

Public files are the TypeScript/HTML/CSS source, three original build/configuration
files, launcher, lockfile, sample text, tests, licence, README, ignore rules, and
this audit. No binary release is published.

`content.txt` appears to contain a book extract. The file under `texts/` appears
to contain an article transcription. Their redistribution rights and provenance
were not established, so they are excluded from the public archive. Both remain
in the original private backup, as do old build outputs and installed dependencies.
The source does not depend on either reading file; users choose their own input.

## Verification

Environment: macOS arm64, Node.js 26.12.0, npm 11.20.0.

| Check | Result | Evidence boundary |
| --- | --- | --- |
| Initial `tsc -p tsconfig.json --noEmit` using installed compiler | Exit 0 | Static type check |
| `npm run build` in working folder | Exit 0 | Type check and three esbuild bundles |
| `npm test` in working folder | 6 passed, exit 0 | Synthetic inputs and controlled timers |
| Fresh copy: `npm ci --ignore-scripts --no-audit --no-fund` | Exit 0, 318 packages installed | Lockfile installation; no dependency lifecycle scripts |
| Fresh copy: `npm run build` | Exit 0 | Build with freshly installed dependencies |
| Fresh copy: `npm test` | 6 passed, exit 0 | Same deterministic checks in the fresh environment |
| `npm audit --json` | Exit 1 | Known dependency findings; not a clean security audit |

The six tests cover whitespace/punctuation handling, Unicode red-letter selection,
speed/punctuation/start-delay relationships, end-of-text pausing, pause while a
word callback is pending, and text replacement with bounded seeking. They test
software behaviour, not human reading outcomes or live audio.

The lockfile's package URLs all use the npm registry and every non-root package
entry has an integrity hash. All five installed direct dependency versions match
the lockfile: `@types/node` 22.19.19, `esbuild` 0.25.12, `electron` 36.9.5,
`electron-builder` 26.8.1, and `typescript` 5.9.3. Integrity hashes establish
content consistency, not absence of malicious or vulnerable code.

The registry audit reported 17 affected package entries: 2 moderate, 14 high,
and 1 critical. These include direct Electron and electron-builder entries; the
critical entry is transitive `tar`. These counts are package entries, not 17
independent exploit demonstrations. No automatic dependency fixes were applied.
The private backup directory contains the raw audit JSON. Results reflect the
registry response obtained during this audit and can change over time.

A targeted pattern scan of the initial 18 proposed source/configuration/sample
files found no private-key headers, GitHub-token patterns, AWS access-key patterns,
credential assignments, or absolute user-home paths. This is a limited static
check, not a guarantee that every possible secret has been detected.

Not verified: live Electron startup, screen layout, file picker, full-screen
behaviour, speech output, accessibility, packaging, signing, notarisation,
cross-platform behaviour, offline installation, or byte-identical binaries.

## Known limits retained

Clearing the paste box leaves previous words loaded. File read failures do not
have a friendly UI error handler. Pausing with the Play button does not explicitly
stop speech. Some system voices can be remote. No network capture or runtime
privacy test was performed. The source has no explicit text upload, analytics,
or text persistence, but that observation does not certify dependency or voice
provider behaviour. See the README for normal use and further limits.

## Archival and local-removal conditions

Publication uses an explicit file allowlist. Before local removal, the final
commit must be pushed, a separate clone must match its commit and tracked file
hashes, and GitHub must report the repository public and archived. The final
source snapshot is also retained privately outside the project, alongside the
verified original backup. No imported text or unique original binary may be
lost merely because it is excluded from GitHub. Operational completion and
backup locations are reported separately after these conditions are checked.
