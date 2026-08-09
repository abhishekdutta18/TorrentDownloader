import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
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
