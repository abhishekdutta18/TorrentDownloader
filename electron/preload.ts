import { ipcRenderer, contextBridge } from 'electron'

// --------- Restricted IPC Channel Whitelist ---------
// Only allow the renderer to communicate on channels the app actually uses.
// This prevents a compromised renderer from invoking arbitrary IPC handlers.
const ALLOWED_INVOKE_CHANNELS = new Set([
  'add-torrent',
  'get-torrents-status',
  'remove-torrent',
  'pause-torrent',
  'resume-torrent',
  'get-settings',
  'save-settings',
  'select-folder',
  'open-folder',
  'toggle-devtools',
  'set-clipboard-watch',
  'get-clipboard-watch',
  'start-stream',
  'play-external',
  'clear-media-player',
  'stop-stream',
  'prioritize-file',
  'skip-file',
  'copy-to-clipboard',
  'show-confirm-dialog',
  'open-torrent-dialog',
  'set-sequential',
  'search-torrents',
  'fetch-rss',
])

const ALLOWED_RECEIVE_CHANNELS = new Set([
  'main-process-message',
  'clipboard-magnet-detected',
])

// Expose a restricted ipcRenderer that only allows whitelisted channels
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(channel: string, listener: (...args: any[]) => void) {
    if (!ALLOWED_RECEIVE_CHANNELS.has(channel)) {
      console.warn(`[Preload] Blocked ipcRenderer.on for unauthorized channel: ${channel}`)
      return
    }
    ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(channel: string, listener: (...args: any[]) => void) {
    if (!ALLOWED_RECEIVE_CHANNELS.has(channel)) return
    ipcRenderer.off(channel, listener)
  },
  invoke(channel: string, ...args: any[]) {
    if (!ALLOWED_INVOKE_CHANNELS.has(channel)) {
      console.warn(`[Preload] Blocked ipcRenderer.invoke for unauthorized channel: ${channel}`)
      return Promise.reject(new Error(`Channel "${channel}" is not allowed`))
    }
    return ipcRenderer.invoke(channel, ...args)
  },
})

contextBridge.exposeInMainWorld('torrentApi', {
  addTorrent: (torrentId: string) => ipcRenderer.invoke('add-torrent', torrentId),
  getTorrentsStatus: (expandedHash?: string) => ipcRenderer.invoke('get-torrents-status', expandedHash),
  removeTorrent: (infoHash: string) => ipcRenderer.invoke('remove-torrent', infoHash),
  pauseTorrent: (infoHash: string) => ipcRenderer.invoke('pause-torrent', infoHash),
  resumeTorrent: (infoHash: string) => ipcRenderer.invoke('resume-torrent', infoHash),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: Record<string, unknown>) => ipcRenderer.invoke('save-settings', settings),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  openFolder: (path: string) => ipcRenderer.invoke('open-folder', path),
  toggleDevTools: () => ipcRenderer.invoke('toggle-devtools'),
  setClipboardWatch: (enabled: boolean) => ipcRenderer.invoke('set-clipboard-watch', enabled),
  getClipboardWatch: () => ipcRenderer.invoke('get-clipboard-watch'),
  onClipboardMagnet: (callback: (magnet: string) => void) => {
    const handler = (_event: any, magnet: string) => callback(magnet)
    ipcRenderer.on('clipboard-magnet-detected', handler)
    return () => { ipcRenderer.removeListener('clipboard-magnet-detected', handler) }
  },
  startStream: (infoHash: string, fileIndex: number) => ipcRenderer.invoke('start-stream', infoHash, fileIndex),
  playExternal: (infoHash: string, fileIndex: number) => ipcRenderer.invoke('play-external', infoHash, fileIndex),
  clearMediaPlayer: () => ipcRenderer.invoke('clear-media-player'),
  stopStream: (infoHash: string) => ipcRenderer.invoke('stop-stream', infoHash),
  prioritizeFile: (infoHash: string, fileIndex: number) => ipcRenderer.invoke('prioritize-file', infoHash, fileIndex),
  skipFile: (infoHash: string, fileIndex: number) => ipcRenderer.invoke('skip-file', infoHash, fileIndex),
  copyToClipboard: (text: string) => ipcRenderer.invoke('copy-to-clipboard', text),
  showConfirmDialog: (title: string, message: string) => ipcRenderer.invoke('show-confirm-dialog', title, message),
  openTorrentDialog: () => ipcRenderer.invoke('open-torrent-dialog'),
  setSequential: (infoHash: string, sequential: boolean) => ipcRenderer.invoke('set-sequential', infoHash, sequential),
  searchTorrents: (query: string) => ipcRenderer.invoke('search-torrents', query),
  fetchRss: (url: string) => ipcRenderer.invoke('fetch-rss', url)
})
