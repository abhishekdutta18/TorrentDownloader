# Torrent Downloader

A modern, fast, and feature-rich desktop Torrent client built with Electron, React, Vite, and WebTorrent.

## Features

- 🚀 **Lightning Fast**: Built on WebTorrent and optimized for high performance with minimal memory footprint.
- 🧲 **Magnet Link Support**: Seamlessly handles magnet links and protocol interception (e.g. `magnet://`).
- 🎬 **Stream Media**: Built-in HTTP streaming server allows you to play video/audio files directly while they are downloading.
- 📡 **RSS Automation**: Subscribe to RSS feeds and auto-download torrents based on custom regex rules.
- ⚙️ **Bandwidth Control**: Throttle your download and upload speeds to manage your network usage.
- 🎨 **Beautiful UI**: Modern, responsive dark mode interface powered by React and Tailwind-style utility classes.
- 🔒 **Secure & Cynical**: Fortified against path traversal vulnerabilities, race conditions, and memory leaks.

## Technology Stack

- **Frontend**: React, TypeScript, Vite, Lucide Icons
- **Backend/Desktop**: Electron, Node.js
- **Torrent Engine**: WebTorrent

## Installation

For most users, the easiest way to install Torrent Downloader is by downloading the pre-built application.

### macOS (Apple Silicon)
1. Navigate to the `release/` folder or download the latest `.dmg` file from the [Releases](https://github.com/abhishekdutta18/TorrentDownloader/releases) page.
2. Double-click the `Torrent Downloader-0.0.0-arm64.dmg` file to mount it.
3. Drag and drop the **Torrent Downloader** application into your `Applications` folder.
4. Launch the app from your Applications folder!

---

## Development

If you wish to build the app from source or contribute to development:

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- npm or yarn

### Setup

1. Clone the repository
```bash
git clone https://github.com/abhishekdutta18/TorrentDownloader.git
cd TorrentDownloader
```

2. Install dependencies
```bash
npm install
```

3. Run in development mode
```bash
npm run dev
```

### Building the DMG

To package the application and generate a new `.dmg` installer for macOS:

```bash
npm run build
```
The compiled DMG installer will be available in the `release/` directory.

## Architecture Highlights
- **Selective IPC Serialization**: The UI maintains a smooth 60fps by selectively syncing file/chunk metadata only for expanded torrents.
- **Atomic State Saves**: Torrent states and user preferences are saved atomically, preventing corruption on sudden power loss or app crashes.

## License
MIT
