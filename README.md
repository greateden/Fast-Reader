# FastReader

FastReader is a small desktop app that displays text one word at a time. This is
called rapid serial visual presentation (RSVP). A red letter stays near the
centre guide as the words change. You can adjust the speed, move through the
text, and optionally hear each word.

This is a preserved software prototype. The project is closed and is not
maintained. The final dependency audit reported 17 affected package entries
(2 moderate, 14 high, 1 critical); this is an archival snapshot, not a supported
application release. No experiments, participant data, reading-comprehension measurements,
or evidence of improved reading speed are included. The timing and red-letter
rules are implementation choices, not validated research findings. There are no
text-restoration algorithms in this project.

## Build and check

You need Node.js and npm. The final local checks used Node.js 26.12.0 and npm
11.20.0 on macOS arm64. Other platforms have not been verified.

```sh
npm ci --ignore-scripts
npm run build
npm test
```

`npm ci` installs the versions in `package-lock.json` and replaces any existing
`node_modules`. `--ignore-scripts` prevents dependency installation scripts from
running. This is enough for the build and deterministic tests on the checked
platform; it does not install the Electron runtime needed to open the app.
The lockfile uses the npm registry and includes package integrity hashes.
See the official [npm ci documentation](https://docs.npmjs.com/cli/commands/npm-ci/).

To run the desktop app, use a separate working copy and run `npm ci` without
`--ignore-scripts`, then `npm run dev`. This allows dependency installation code
to run, including the Electron runtime download and esbuild setup. The locked
Electron package obtains its runtime from the official Electron releases by
default; local proxy or mirror settings can change that source. Review those
settings before installation. The archive does not certify these old dependencies
as secure or supported. Use the preserved source for inspection and reproduction.

## Use

Open `sample.txt` with the Open button, or paste your own text. Supported file
extensions are `.txt`, `.text`, and `.md`; Markdown is read as plain text.
Whitespace separates words and punctuation stays attached.

| Control | Action |
| --- | --- |
| Play button | Start or pause; attempts to enter full screen |
| Hold Space | Play while held; release to pause |
| O or Cmd/Ctrl+O | Open a text file |
| Up / Down | Change the speed by 25 WPM |
| Left / Right | Step one word while paused |
| R | Return to the beginning |
| S | Toggle speech |
| Esc | Exit full screen, then close the window |
| Text slider | Adjust the displayed text size |
| Progress slider | Move to another word |

Most shortcuts are ignored while a form control has focus. The speed setting is
100–1000 words per minute (WPM), with a default of 300. Actual playback varies:
long words, estimated syllables, punctuation, and the opening words alter delays.
It is not a measured reading-speed score.

## How it works

`src/main/main.ts` opens the Electron window and reads a file selected by the user.
`preload.ts` exposes only the file picker and window-close actions to the page.
`src/renderer/app.ts` connects the controls to the reader.

`text.ts` splits input on whitespace. `orp.ts` chooses a red letter and computes
word delays. Its letter index is 0 for one letter, 1 for 2–5 letters, 2 for 6–9,
3 for 10–13, and 4 for longer words. Indices start at zero and count Unicode
letters; tokens without letters fall back to their characters. The page measures
the red span and aligns its centre with the guide. This rule is named ORP in the
code; the name does not establish an optimal point for a reader.

`reader.ts` schedules word changes. `speech.ts` uses the browser speech API,
selects from available English voices, and cancels speech when the next token
starts. It uses a deadline rather than waiting indefinitely for a voice, so words
can be cut off. Voice availability and audio quality depend on the system.

## Privacy and limits

The application source has no explicit upload, analytics, or text-saving code.
Imported text stays in application memory. This is a static source observation,
not a network or forensic privacy test. Speech can select a voice that is not
local; its provider may process text remotely. Keep speech off for sensitive text.

The final checks cover compilation and deterministic text/timer behaviour. They
do not establish live window, full-screen, file-picker, speech, accessibility,
or cross-platform correctness. Known limits include stale loaded words if the
paste box is cleared, no friendly file-read error message, and possible continued
speech after the Play button pauses. These were documented rather than expanding
the final audit into feature development.

## Packaging and archive contents

`npm run package` creates an unpacked application in `release/`; `npm run dist`
requests platform packages there. Neither packaging command was verified during
the final audit. Signing and notarisation are not configured. Build output goes
to `dist/`, separate from package output so an old app cannot be bundled into the
next app through the `dist/**/*` input pattern.

The public archive contains source, build scripts, deterministic tests, the
lockfile, this guide, the audit record, and `sample.txt`. Imported reading texts,
installed dependencies, and old binaries are excluded. Their original copies
were preserved in a private backup before changes. No research results have
been added or inferred. See [AUDIT.md](AUDIT.md) for the final evidence and limits.

The original package declared MIT; [LICENSE](LICENSE) supplies that licence for
the project source. Dependency licences remain with their respective authors.
