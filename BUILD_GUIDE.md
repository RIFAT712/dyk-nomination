# Building and Maintenance Guide: DYK Nomination Tool

This document provides detailed instructions on how to build, test, and maintain the DYK Nomination Tool userscript.

## 1. Project Structure Review

*   **`src/`**: Contains the active source code.
    *   `dyk-core.js`: The "brain" - API interactions, wikitext generation, and logic.
    *   `dyk-ui.js`: The "face" - Vue 3 / Codex components and UI logic.
    *   `dyk-ui.css`: Custom styles for the interface.
    *   `dyk.js`: The entry point that initializes the app.
*   **`scripts/`**: Automation scripts.
    *   `build.ps1`: Windows PowerShell script to bundle the files.
*   **`dist/`**: Contains the final bundled product (`dyk.js`). **Do not edit files here directly.**
*   **`tests/`**: Automated tests to ensure code quality.

---

## 2. Building the Script

The project uses a simple concatenation strategy to combine multiple files into a single script that MediaWiki can load.

### Option A: Using PowerShell (Recommended for Windows)
1. Open a terminal (PowerShell) in the project root.
2. Run the build script:
   ```powershell
   ./scripts/build.ps1
   ```
3. The bundled file will be created at `dist/dyk.js`.

### Option B: Using npm
If you have Node.js installed, you can use the shortcut defined in `package.json`:
```bash
npm run build
```

### What the build script does:
1.  Creates the `dist/` directory if it doesn't exist.
2.  Wraps the script in `<nowiki>` tags for MediaWiki safety.
3.  Concatenates `dyk-ui.js`, `dyk-core.js`, and `dyk.js`.
4.  Injects the contents of `dyk-ui.css` dynamically into the document head.
5.  Outputs the final result as `dist/dyk.js` using UTF-8 encoding.

---

## 3. Local Development Workflow

1.  **Make Changes**: Edit files inside the `src/` directory.
2.  **Lint Code**: Ensure your code follows standards:
    ```bash
    npm run lint
    ```
3.  **Run Tests**: Verify logic hasn't broken:
    ```bash
    npm test
    ```
4.  **Build**: Bundle the changes using the build script.
5.  **Test on Wiki**:
    *   Copy the content of `dist/dyk.js`.
    *   Paste it into your `common.js` or a personal subpage on Wikipedia.
    *   Reload the page to see changes.

---

## 4. Maintenance Best Practices

### Adding New Components
When adding new UI elements, keep the logic in `dyk-ui.js` and only add necessary styles to `dyk-ui.css`.

### Updating Dependencies
If the project evolves to use external libraries via npm, ensure they are compatible with the MediaWiki environment (which provides jQuery and Vue 3 globally).

### Versioning
Follow semantic versioning (Major.Minor.Patch) in `package.json`.
1. Update version in `package.json`.
2. Commit and tag the release:
   ```bash
   git tag -a v1.0.1 -m "Version 1.0.1 description"
   git push origin v1.0.1
   ```

### Troubleshooting
*   **Encoding Issues**: Always ensure files are saved in **UTF-8 (without BOM)**. The build script is configured to handle this, but your editor should match.
*   **CSS Not Loading**: If styles aren't appearing, check the `styleLoader` section in `scripts/build.ps1`.
