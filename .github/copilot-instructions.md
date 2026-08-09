# GitHub Copilot Instructions
# This file provides repository-specific context and rules to GitHub Copilot (and Copilot Workspace).

## Tech Stack
- Frontend: React 18, TypeScript, Vite
- Backend/Desktop: Electron, Node.js
- Torrent Client: WebTorrent (using the `webtorrent` package)

## Coding Standards
1. **TypeScript Rules:** Always use strict typing. Avoid `any` where possible.
2. **React Patterns:** Use functional components and Hooks. No class components.
3. **Electron Security:** Never enable `nodeIntegration` in BrowserWindow webPreferences. Always use `contextBridge` in `preload.ts` to expose safe IPC APIs to the renderer process.
4. **Error Handling:** Always wrap IPC handlers in try-catch blocks and return descriptive error objects to the renderer.

## Project Context
This is a desktop Torrent Downloader application. It uses an embedded WebTorrent client in the main process to download files. The renderer process requests actions (like adding a torrent, pausing, or changing settings) via Electron's IPC mechanism.

## Testing
- Unit tests are written using Vitest.
- Place tests adjacent to the file they test, e.g., `feature.test.ts`.
