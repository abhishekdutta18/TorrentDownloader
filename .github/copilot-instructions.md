# GitHub Copilot Instructions
# This file provides repository-specific context and rules to GitHub Copilot (and Copilot Workspace).

## Tech Stack
- Frontend: React 18, TypeScript, Vite
- Backend Engine: libtorrent-rasterbar (C++17)
- REST API Server: C++ Embedded HTTP Server (`httplib`)
- Desktop/macOS: Swift AppKit/WKWebView (`FluxTorrent.app`)

## Coding Standards
1. **TypeScript Rules:** Always use strict typing. Avoid `any` where possible.
2. **React Patterns:** Use functional components and Hooks. No class components.
3. **C++ Best Practices:** Use RAII, smart pointers, exception safety, and lock guards.
4. **Error Handling:** Always return descriptive error responses and status codes from REST endpoints.

## Project Context
This is a high-performance desktop Torrent Downloader application powered by the native `libtorrent-rasterbar` engine. An embedded C++ HTTP server exposes REST endpoints to manage torrents, streams, RSS automation, and search, which the web/desktop frontend interacts with via standard fetch calls.

## Testing
- Unit tests are written using Vitest.
- Place tests adjacent to the file they test, e.g., `feature.test.ts`.
