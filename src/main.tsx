import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if (window.ipcRenderer) {
  window.ipcRenderer.on('main-process-message', (_event, message) => {
    console.log(message)
  })
}

// Fallback for Capacitor / Mobile Browsers
if (!window.torrentApi) {
  window.torrentApi = {
    addTorrent: async () => { alert("The Torrent Engine is not yet supported on Mobile."); },
    getTorrentsStatus: async () => [],
    pauseTorrent: async () => {},
    resumeTorrent: async () => {},
    removeTorrent: async () => {},
    openFolder: () => {},
    openTorrentDialog: async () => null,
    searchTorrents: async () => ({ error: "Not supported" } as any),
    setSequential: () => {},
    startStream: async () => "",
    playExternal: async () => {},
    copyToClipboard: async () => {},
    getSettings: async () => ({}),
    saveSettings: async () => {},
    toggleDevTools: () => {},
    showConfirmDialog: async () => false,
    onClipboardMagnet: () => { return () => {}; }
  } as any;
}
