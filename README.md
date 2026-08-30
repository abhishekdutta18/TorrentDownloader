# OmniFlux — High-Performance Torrent Client

<div align="center">

<img src="public/logo.png" alt="OmniFlux Logo" width="128" height="128" style="border-radius: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);" />

### A modern, secure, high-performance BitTorrent client for macOS powered by native C++ and Swift.

[![C++ CI](https://github.com/abhishekdutta18/TorrentDownloader/actions/workflows/cpp-ci.yml/badge.svg)](https://github.com/abhishekdutta18/TorrentDownloader/actions/workflows/cpp-ci.yml)
[![CodeQL Security Scan](https://github.com/abhishekdutta18/TorrentDownloader/actions/workflows/codeql.yml/badge.svg)](https://github.com/abhishekdutta18/TorrentDownloader/actions/workflows/codeql.yml)
[![Platform](https://img.shields.io/badge/Platform-macOS%20(Apple%20Silicon%20%26%20Intel)-black?logo=apple)](https://github.com/abhishekdutta18/TorrentDownloader)
[![Engine](https://img.shields.io/badge/Engine-libtorrent--rasterbar%202.x-blue?logo=c%2B%2B)](https://libtorrent.org/)
[![UI](https://img.shields.io/badge/UI-React%2018%20%7C%20Vite%208%20%7C%20Tailwind-61DAFB?logo=react)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Features](#-key-features) • [Architecture](#-architecture) • [Installation](#-installation) • [Build from Source](#-building-from-source) • [Security](#-integrated-security--threat-protection) • [API](#-rest-api-reference)

</div>

---

## 📖 Overview

**OmniFlux** is an open-source BitTorrent client crafted specifically for performance, safety, and a seamless native user experience. Built completely without heavy Electron runtimes, OmniFlux couples a native **C++17 libtorrent-rasterbar** core with a lightweight **macOS Swift** container, an embedded streaming server, and an ultra-responsive **React + Tailwind CSS** frontend.

OmniFlux also features an **integrated anti-malware threat intelligence system** that scans payloads in real time, queries the **MalwareBazaar** cloud database via SHA-256 signatures, detects high-risk executable extensions, and automatically tags files with macOS quarantine attributes (`com.apple.quarantine`).

---

## 🚀 Key Features

| Feature | Description |
| :--- | :--- |
| **⚡ Native libtorrent Core** | Full BitTorrent v1 & v2 protocol implementation with DHT, PEX, LSD, NAT-PMP, UPnP, and fast resume serialization. |
| **🛡️ Real-Time Malware Defense** | Inspects torrent payloads before and during downloads. Identifies high-risk executables (`.exe`, `.scr`, `.bat`, `.vbs`, etc.) and performs online reputation lookups against MalwareBazaar. |
| **🏷️ macOS Quarantine Tagging** | Automatically tags suspicious downloads with `com.apple.quarantine` attributes so macOS Gatekeeper protects you before execution. |
| **🎬 Media Streaming & Playback** | Stream video and audio torrents sequentially with on-the-fly HTTP byte-range seek support. Includes in-app playback and native macOS AVPlayer (`OmniPlayerCore`) fallback. |
| **🔍 Multi-Provider Torrent Search** | Search across leading public torrent repositories directly from the app. Instant sorting by seeders, leechers, file size, and upload date. |
| **📡 Automated RSS Downloads** | Subscribe to your favorite torrent RSS feeds and configure custom RegEx filters to automatically download new matching items. |
| **🎛️ Bandwidth & Ratio Management** | Fine-grained global and per-torrent download/upload speed limits, sequential downloading toggle, and seeding ratio controls. |
| **🧲 Smart Magnet Interception** | Instant magnet URL normalization, info hash auto-detection (hex and base32), and automatic clipboard monitoring. |
| **🎨 Sleek Native Design** | Dark mode UI with macOS native traffic-light integration, live status indicators, file priority selectors, and tab-level badge counts. |

---

## 🏗 Architecture

OmniFlux is architected into three decoupled, high-performance layers:

```mermaid
graph TD
    subgraph macOS Host Application
        A[FluxTorrent Swift Native App]
        B[WKWebView UI Host]
        C[OmniPlayerCore Native AVPlayer]
    end

    subgraph Embedded C++ Engine
        D[Embedded REST & Stream Server - cpp-httplib]
        E[TorrentEngine - libtorrent-rasterbar]
        F[SecurityManager - SHA256 & MalwareBazaar]
        G[RSSWorker - Feed Poller & Filter]
    end

    subgraph Modern Web UI
        H[React 18 + Vite 8 UI]
        I[Lucide Icons & Tailwind CSS]
    end

    A --> B
    A --> C
    B --> H
    H --> D
    D --> E
    D --> F
    D --> G
    E --> F
```

- **Frontend (`src/`)**: Written in React 18, TypeScript, and Vite. Handles user interactions, instant filtering, torrent additions, and settings configuration. Communicates with the engine over local REST endpoints.
- **Engine (`cpp/`)**: High-throughput C++17 daemon embedding `libtorrent-rasterbar`. Implements the state machine, disk I/O, network peers, security scanner, and HTTP streaming server on `localhost:8080`.
- **macOS Container (`FluxTorrent/`)**: Pure Swift native macOS application managing the system window lifecycle, traffic-light bar, native file dialogs, and AVPlayer media playback.

---

## 🛡 Integrated Security & Threat Protection

BitTorrent downloads often carry risks of disguised trojans, ransomware, or malicious executables. OmniFlux protects users with an active 4-tier security pipeline:

1. **Pre-Download File Extension Heuristics**: Identifies executable, script, and screensaver payloads (`.exe`, `.scr`, `.bat`, `.cmd`, `.vbs`, `.js`, `.pif`).
2. **Auto-Skip Dangerous Files**: When enabled in Settings, dangerous executable files within multi-file torrents are automatically set to priority 0 (skipped) while allowing media/docs to download safely.
3. **MalwareBazaar Cloud Hash Lookup**: Checks completed file SHA-256 hashes against abuse.ch MalwareBazaar's real-time malware intelligence API.
4. **macOS Quarantine Tagging**: Suspicious or downloaded executable files receive native `com.apple.quarantine` extended attributes (`setxattr`), triggering macOS Gatekeeper verification upon any launch attempt.

---

## 📦 Installation

### Pre-Built macOS App
1. Download the latest release from the [Releases](https://github.com/abhishekdutta18/TorrentDownloader/releases) page.
2. Drag and drop **OmniFlux.app** into your `/Applications` directory.
3. *(First Run)* If prompted with an unsigned app notice from macOS Gatekeeper:
   ```bash
   xattr -cr "/Applications/OmniFlux.app"
   ```
4. Launch **OmniFlux** and start downloading!

---

## 🛠 Building from Source

### Prerequisites

Ensure the following tools are installed on your macOS system:
- **macOS 12.0+** with **Xcode Command Line Tools**:
  ```bash
  xcode-select --install
  ```
- **Homebrew** packages:
  ```bash
  brew install cmake libtorrent-rasterbar xcodegen node
  ```

### Build Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/abhishekdutta18/TorrentDownloader.git
   cd TorrentDownloader
   ```

2. **Install frontend dependencies**:
   ```bash
   npm ci
   ```

3. **Build and test the native C++ engine**:
   ```bash
   cmake -B cpp/build -S cpp
   cmake --build cpp/build -j4
   (cd cpp/build && ctest --output-on-failure)
   ```

4. **Build the complete macOS application bundle**:
   ```bash
   bash build_app.sh
   ```
   The compiled **OmniFlux.app** will be generated in `build/` and copied to `~/Desktop/OmniFlux.app`.

---

## 🧪 Testing & Quality Assurance

OmniFlux maintains automated CI and validation tests across both the C++ backend and the React frontend:

| Component | Command | Coverage |
| :--- | :--- | :--- |
| **C++ Engine Tests** | `npm run test:cpp` | Engine initialization, magnet parsing, torrent file loading, pause/resume, thread safety, multi-source search parsing, security extension detection, and SHA-256 calculations. |
| **UI & Type Validation** | `npm test` | TypeScript type-checking (`tsc --noEmit`), JSX string literal newline verification, and Vite production bundle compilation. |
| **Code Linting** | `npm run lint` | ESLint rules for React Hooks and React Refresh. |

---

## 🔌 REST API Reference

OmniFlux's embedded C++ backend exposes a lightweight HTTP REST API on `http://localhost:8080`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/torrents` | List all active torrents with download/upload rates, progress, peers, and file lists. |
| `POST` | `/api/torrents/add` | Add a torrent from magnet link, raw info hash, or base64 file data. |
| `POST` | `/api/torrents/pause` | Pause an active torrent. |
| `POST` | `/api/torrents/resume` | Resume a paused torrent. |
| `POST` | `/api/torrents/remove` | Remove a torrent (optionally deleting downloaded files). |
| `POST` | `/api/torrents/sequential` | Toggle sequential downloading for high-speed streaming. |
| `POST` | `/api/torrents/file-priority` | Prioritize or skip individual files within a torrent. |
| `GET` | `/api/settings` | Retrieve client settings (limits, download paths, security toggles). |
| `POST` | `/api/settings` | Update client settings. |
| `GET` | `/api/search?q={query}` | Perform real-time multi-provider torrent search. |
| `GET` | `/api/rss/fetch` | Fetch RSS feed items and auto-queue matching rules. |
| `GET` | `/api/security/scan?hash={hash}` | Trigger an immediate MalwareBazaar lookup for a torrent info hash. |
| `GET` | `/stream/:hash/:index` | Byte-range HTTP stream endpoint for media players. |

---

## 🤝 Contributing

Contributions are welcome! To get started:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/awesome-feature`).
3. Commit your changes (`git commit -m 'feat: add awesome feature'`).
4. Ensure all tests pass (`npm test` and `npm run test:cpp`).
5. Push to your branch and open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
