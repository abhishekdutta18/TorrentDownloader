interface AppSettings {
  downloadPath: string
  downloadLimit: number
  uploadLimit: number
  startOnBoot: boolean
  mediaPlayerPath: string
  rssFeeds: string[]
  rssRules: string[]
}

interface Window {
  ipcRenderer: import('electron').IpcRenderer
  torrentApi: {
    addTorrent: (torrentId: string) => Promise<{ infoHash: string }>
    getTorrentsStatus: (expandedHash?: string) => Promise<Record<string, unknown>[]>
    removeTorrent: (infoHash: string) => Promise<void>
    pauseTorrent: (infoHash: string) => Promise<void>
    resumeTorrent: (infoHash: string) => Promise<void>
    getSettings: () => Promise<AppSettings>
    saveSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>
    selectFolder: () => Promise<string | null>
    openFolder: (path: string) => Promise<void>
    toggleDevTools: () => Promise<void>
    copyToClipboard: (text: string) => Promise<void>
    setClipboardWatch: (enabled: boolean) => Promise<boolean>
    getClipboardWatch: () => Promise<boolean>
    onClipboardMagnet: (callback: (magnet: string) => void) => () => void
    startStream: (infoHash: string, fileIndex: number) => Promise<string>
    playExternal: (infoHash: string, fileIndex: number) => Promise<boolean>
    clearMediaPlayer: () => Promise<void>
    stopStream: (infoHash: string) => Promise<void>
    prioritizeFile: (infoHash: string, fileIndex: number) => Promise<void>
    skipFile: (infoHash: string, fileIndex: number) => Promise<void>
    showConfirmDialog: (title: string, message: string) => Promise<boolean>
    openTorrentDialog: () => Promise<string | null>
    setSequential: (infoHash: string, sequential: boolean) => Promise<void>
    searchTorrents: (query: string) => Promise<any>
    fetchRss: (url: string) => Promise<any>
  }
}
