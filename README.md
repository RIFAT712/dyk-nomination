# DYK Nomination Tool (Codex Migration)

This is a Wikimedia userscript for "Did You Know" (DYK) nominations on Bengali Wikipedia (bnwiki), migrated from OOUI to Codex.

## Structure
- `dyk-core.js`: Core logic, API calls, and wikitext generation.
- `dyk-ui.js`: Codex (Vue 3) based UI components.
- `dyk.js`: Entry point and loader.
- `ooui.js`: (Deprecated) Old OOUI helper.

## How to use from GitHub
1.  Push your changes to this repository.
2.  Use a loader script on your Wikipedia common.js or a subpage (e.g., `User:R1F4T/dyk-loader.js`):

```javascript
// Loader
mw.loader.using(['vue', 'ext.codex.v3', 'mediawiki.api', 'mediawiki.util'], function() {
    const branch = 'main'; // or your branch name
    const user = 'YOUR_GITHUB_USERNAME';
    const repo = 'DYK_Nom';
    const cdn = `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}`;

    $.getScript(`${cdn}/dyk-core.js`).then(() => {
        $.getScript(`${cdn}/dyk-ui.js`).then(() => {
            $.getScript(`${cdn}/dyk.js`);
        });
    });
});
```

## Local Development
To combine files into a single script for easy copy-pasting to Wikipedia:
Run `build.ps1` (on Windows) or concatenate them manually.
