# Developer Documentation

## Prerequisites
- Node.js (for linting and local tools)
- PowerShell (for the build script on Windows)

## Setup
1. Clone the repository.
2. Run `npm install` to install dev dependencies for linting.

## Building
To generate the final userscript in `dist/dyk.js`, run:
```powershell
./scripts/build.ps1
```

## Testing
Currently, mock tests are located in `tests/mock-test.js`. Run them using:
```bash
npm test
```
