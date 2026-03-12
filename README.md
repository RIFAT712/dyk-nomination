# DYK Nomination Tool (Codex Migration)

This is a Wikimedia userscript for "Did You Know" (DYK) nominations on Bengali Wikipedia (bnwiki), migrated from OOUI to Codex.

## Features
- **Article Validation:** Checks if the article exists in the main namespace before submission.
- **Auto-Suggestions:** Provides search suggestions for articles and images.
- **Live Preview:** Shows a real-time preview of the nomination wikitext.
- **Character Count:** Tracks hook length to ensure it meets DYK standards (<200 chars).
- **Copy Wikitext:** Quickly copy the generated wikitext for manual use.
- **Modern UI:** Built with Vue 3 and Codex for a consistent Wikimedia experience.

## Structure
- `src/dyk-core.js`: Core logic, API calls, and wikitext generation.
- `src/dyk-ui.js`: Codex (Vue 3) based UI components.
- `src/dyk-ui.css`: Custom styling for the interface.
- `src/dyk.js`: Entry point and loader.
- `scripts/build.ps1`: Build script to concatenate files.
- `tests/`: Mock and unit tests.

## How to use from GitHub
... (rest of the section) ...

## Local Development
To combine files into a single script for easy copy-pasting to Wikipedia:
Run `scripts/build.ps1` (on Windows) to generate `dist/dyk.js`.

```powershell
./scripts/build.ps1
```

Or using npm:

```bash
npm run build
```

Then copy the content of `dist/dyk.js` to your wiki user script page.
