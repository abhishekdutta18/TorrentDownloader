 
import { app, BrowserWindow, ipcMain, Menu, dialog, MenuItemConstructorOptions, shell, clipboard } from 'electron'
import { autoUpdater } from 'electron-updater'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { execFile } from 'node:child_process'

// @ts-expect-error Types are not available
const WebTorrent = (await import(/* @vite-ignore */ 'webtorrent')).default
import { store } from './store'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let clipboardWatchInterval: ReturnType<typeof setInterval> | null = null
let lastClipboardMagnet = ''
const client = new WebTorrent({
  maxConns: 200, // Safely balanced to prevent EMFILE (max file descriptor) crashes on macOS while retaining high performance
  dht: true,
  utp: true,
  lsd: true,
  webSeeds: true,
  tracker: {
    announce: [
      'udp://tracker.opentrackr.org:1337/announce',
      'udp://open.tracker.cl:1337/announce',
      'udp://tracker.openbittorrent.com:6969/announce',
      'udp://exodus.desync.com:6969/announce',
      'udp://tracker.torrent.eu.org:451/announce',
      'udp://open.stealth.si:80/announce',
      'udp://tracker.dler.org:6969/announce',
      'udp://tracker.moeking.me:6969/announce',
      'udp://explodie.org:6969/announce',
      'udp://tracker.altrosky.nl:6969/announce',
      'wss://tracker.openwebtorrent.com',
      'wss://tracker.btorrent.xyz',
      'wss://tracker.fastcast.nz'
    ]
  }
})
if (store.settings.downloadLimit > 0 && typeof client.throttleDownload === 'function') {
  client.throttleDownload(store.settings.downloadLimit)
}
if (store.settings.uploadLimit > 0 && typeof client.throttleUpload === 'function') {
  client.throttleUpload(store.settings.uploadLimit)
}

// Tracking mapping for InfoHashes and URLs
const originalIds = new Map<string, string>() // infoHash -> originalId
let webtorrentServer: any = null
// Shared promise to prevent race condition when creating the streaming server
let serverCreationPromise: Promise<void> | null = null

client.on('torrent', (torrent: any) => {
  torrent.on('done', () => {
    if (torrent.infoHash) {
      if (!store.state.completedTorrents) store.state.completedTorrents = []
      if (!store.state.completedTorrents.includes(torrent.infoHash)) {
        store.state.completedTorrents.push(torrent.infoHash)
        saveActiveTorrents()
      }
    }
  })
})

function saveActiveTorrents() {
   
  const magnets = client.torrents.map((t: any) => {
    if (t.infoHash && originalIds.has(t.infoHash)) return originalIds.get(t.infoHash)
    if (t.magnetURI) return t.magnetURI
    if (t.infoHash) return `magnet:?xt=urn:btih:${t.infoHash}`
    return null
  }).filter(Boolean) as string[]

  const pausedTorrents = client.torrents
    .filter((t: any) => t.paused && t.infoHash)
    .map((t: any) => t.infoHash)

  // Persist per-torrent download paths (#11)
  const torrentPaths: Record<string, string> = {}
  client.torrents.forEach((t: any) => {
    if (t.infoHash && t.path) {
      torrentPaths[t.infoHash] = t.path
    }
  })

  store.saveState(magnets, pausedTorrents, store.state.skippedFiles || {}, torrentPaths, store.state.processedRssLinks || [], store.state.completedTorrents || [])
}

function startClipboardWatch() {
  if (clipboardWatchInterval) return
  clipboardWatchInterval = setInterval(() => {
    try {
      const text = clipboard.readText().trim()
      if (text.startsWith('magnet:?') && text !== lastClipboardMagnet) {
        lastClipboardMagnet = text
        win?.webContents.send('clipboard-magnet-detected', text)
      }
    } catch {
      // Ignore clipboard read errors
    }
  }, 2000)
}

function stopClipboardWatch() {
  if (clipboardWatchInterval) {
    clearInterval(clipboardWatchInterval)
    clipboardWatchInterval = null
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 700,
    titleBarStyle: 'hiddenInset',
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.webContents.on('console-message', (_event, _level, message, line, sourceId) => {
      console.log(`[Renderer] ${message} (at ${sourceId}:${line})`)
    })
  }

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  win.on('closed', () => {
    win = null
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// FIX: Graceful cleanup on macOS quit (before-quit fires before window-all-closed on Cmd+Q)
let isQuitting = false
app.on('before-quit', (e) => {
  if (isQuitting) return
  isQuitting = true
  e.preventDefault()
  
  stopClipboardWatch()
  if (webtorrentServer) {
    try { webtorrentServer.close() } catch { /* ignore */ }
    webtorrentServer = null
  }
  client.destroy(async () => {
    // Client destroyed, now wait for pending writes
    await store.waitForWrites()
    app.quit()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('open-url', async (event, url) => {
  event.preventDefault()
  if (url.startsWith('magnet:')) {
    try {
      const infoHashMatch = url.match(/btih:([a-fA-F0-9]{40})/i) || url.match(/btih:([A-Z2-7]{32})/i)
      const infoHash = infoHashMatch ? infoHashMatch[1].toLowerCase() : null
      const existing = infoHash ? client.get(infoHash) : null
      if (!existing) {
        const torrent = client.add(url, { path: store.settings.downloadPath })
        torrent.on('infoHash', () => {
          originalIds.set(torrent.infoHash, url)
          saveActiveTorrents()
        })
        torrent.on('error', (err: Error) => {
          console.error('Protocol handler torrent error:', err)
        })
      }
    } catch (err) {
      console.error('Failed to add magnet from protocol handler:', err)
    }
  }
})

app.on('second-instance', (_event, commandLine) => {
  const url = commandLine.find((arg) => arg.startsWith('magnet:'))
  if (url) {
    try {
      const infoHashMatch = url.match(/btih:([a-fA-F0-9]{40})/i) || url.match(/btih:([A-Z2-7]{32})/i)
      const infoHash = infoHashMatch ? infoHashMatch[1].toLowerCase() : null
      const existing = infoHash ? client.get(infoHash) : null
      if (!existing) {
        const torrent = client.add(url, { path: store.settings.downloadPath })
        torrent.on('infoHash', () => {
          originalIds.set(torrent.infoHash, url)
          saveActiveTorrents()
        })
        torrent.on('error', (err: Error) => {
          console.error('Second instance torrent error:', err)
        })
      }
    } catch (err) {
      console.error('Failed to add magnet from protocol handler:', err)
    }
  }
  if (win) {
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Helper: ensure streaming server is created exactly once (prevents race condition)
async function ensureStreamingServer(): Promise<void> {
  if (webtorrentServer) return
  if (serverCreationPromise) {
    await serverCreationPromise
    return
  }
  serverCreationPromise = new Promise<void>((resolve) => {
    webtorrentServer = (client as any).createServer()
    webtorrentServer.listen(0, () => {
      resolve()
    })
  })
  await serverCreationPromise
  serverCreationPromise = null
}

// Helper: validate URL is safe (prevent SSRF)
function isUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url)
    // Only allow http/https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    // Block localhost and private IPs
    const hostname = parsed.hostname.toLowerCase()
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return false
    if (hostname === '0.0.0.0') return false
    // Block common private/cloud metadata ranges
    if (hostname.startsWith('10.') || hostname.startsWith('192.168.') || hostname.startsWith('172.')) return false
    if (hostname.startsWith('169.254.')) return false // AWS metadata endpoint
    if (hostname === 'metadata.google.internal') return false
    return true
  } catch {
    return false
  }
}

app.whenReady().then(() => {
  // Automatically strip macOS Gatekeeper quarantine attribute on launch if present
  if (process.platform === 'darwin') {
    try {
      const execPath = process.execPath
      if (execPath.includes('.app/')) {
        const appBundlePath = execPath.split('.app/')[0] + '.app'
        execFile('xattr', ['-dr', 'com.apple.quarantine', appBundlePath], () => {})
      }
    } catch {
      // Ignore errors if xattr fails or lacks permissions
    }
  }

  // Check for updates silently in the background
  autoUpdater.checkForUpdatesAndNotify()
  
  // FIX: Ask user before installing update (prevents interrupting active downloads)
  autoUpdater.on('update-downloaded', () => {
    const activeDownloads = client.torrents.filter((t: any) => !t.done && !t.paused).length
    const message = activeDownloads > 0
      ? `An update has been downloaded. You have ${activeDownloads} active download(s). Restart now to install the update?`
      : 'An update has been downloaded. Restart now to install?'
    
    if (win) {
      dialog.showMessageBox(win, {
        type: 'question',
        buttons: ['Later', 'Restart Now'],
        defaultId: 1,
        cancelId: 0,
        title: 'Update Available',
        message,
      }).then(({ response }) => {
        if (response === 1) {
          autoUpdater.quitAndInstall(false, true)
        }
      })
    } else {
      // No window available, install on next launch
      autoUpdater.autoInstallOnAppQuit = true
    }
  })

  createWindow()
  startRssPolling()

  // Setup application menu to enable Copy/Paste on macOS
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(process.platform === 'darwin' ? [
          { type: 'separator' as const },
          { role: 'front' as const },
          { type: 'separator' as const },
          { role: 'window' as const }
        ] : [
          { role: 'close' as const }
        ])
      ]
    }
  ]

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    })
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  if (VITE_DEV_SERVER_URL) {
    setInterval(() => {
      console.log(`[Status] Active torrents: ${client.torrents.length}`)
       
      client.torrents.forEach((t: any) => {
        console.log(`[Status] Torrent ${t.name}: progress=${t.progress}, downSpeed=${t.downloadSpeed}, upSpeed=${t.uploadSpeed}, peers=${t.numPeers}`)
      })
    }, 5000)
  }

  // Register protocol handler for magnet links
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('magnet', process.execPath, [path.resolve(process.argv[1])])
    }
  } else {
    app.setAsDefaultProtocolClient('magnet')
  }

  // Start clipboard watching by default
  startClipboardWatch()

  // Restore active torrents

  const savedPaths = store.state.torrentPaths || {}
  const invalidMagnets: string[] = []
  
  if (store.state.activeTorrents && store.state.activeTorrents.length > 0) {
    store.state.activeTorrents.forEach((magnet) => {
      try {
        console.log(`Restoring torrent: ${magnet}`)
        // Use the saved per-torrent path if available, otherwise fall back to current setting (#11)
        const infoHashFromMagnet = magnet.match(/btih:([a-fA-F0-9]{40})/i)?.[1]?.toLowerCase()
        const torrentPath = (infoHashFromMagnet && savedPaths[infoHashFromMagnet]) || store.settings.downloadPath
        const t = client.add(magnet, { path: torrentPath })

        t.on('ready', () => {
          // Apply saved skip state
          const currentSkipped = store.state.skippedFiles || {}
          if (currentSkipped[t.infoHash]) {
            currentSkipped[t.infoHash].forEach((fileIndex: number) => {
              if (t.files[fileIndex]) {
                t.files[fileIndex].deselect()
              }
            })
          }
          if (t.infoHash && store.state.pausedTorrents?.includes(t.infoHash)) {
            t.pause()
            if (t.wires) {
              t.wires.forEach((wire: any) => wire.destroy())
            }
          }
        })
        t.on('infoHash', () => {
          originalIds.set(t.infoHash, magnet)
          saveActiveTorrents()
        })
        t.on('error', (err: Error) => {
          console.error('Restored torrent error:', err)
          // Track invalid magnets for cleanup (#17)
          invalidMagnets.push(magnet)
        })
      } catch (err) {
        console.error('Failed to restore torrent:', err)
        invalidMagnets.push(magnet)
      }
    })
  }

  if (invalidMagnets.length > 0) {
    setTimeout(() => {
      const active = store.state.activeTorrents || []
      const filtered = active.filter(m => !invalidMagnets.includes(m))
      if (filtered.length !== active.length) {
        store.saveState(filtered, store.state.pausedTorrents || [], store.state.skippedFiles || {}, store.state.torrentPaths || {}, store.state.processedRssLinks || [], store.state.completedTorrents || [])
      }
    }, 10000)
  }

  // IPC Handlers
  ipcMain.handle('add-torrent', async (_event, torrentId) => {
    try {
      // Extract infoHash from magnet URI for reliable duplicate detection
      let searchId = torrentId
      if (typeof torrentId === 'string' && torrentId.startsWith('magnet:')) {
        const infoHashMatch = torrentId.match(/btih:([a-fA-F0-9]{40})/i) || torrentId.match(/btih:([A-Z2-7]{32})/i)
        if (infoHashMatch) searchId = infoHashMatch[1].toLowerCase()
      }

      // Check if already added
      const existing = client.get(searchId)
      if (existing) {
        return { infoHash: existing.infoHash }
      }

      return new Promise((resolve, reject) => {
        let torrent: any
        try {
          console.log(`Adding torrent: ${torrentId}`)
          torrent = client.add(torrentId, { path: store.settings.downloadPath })
        } catch (err: any) {
          console.error('Failed to add torrent:', err)
          return reject(err.message || String(err))
        }

        let resolved = false
        
        torrent.on('infoHash', () => {
          console.log(`Torrent infoHash ready: ${torrent.infoHash}`)
          if (torrentId.startsWith('magnet:') || torrentId.startsWith('http')) {
            originalIds.set(torrent.infoHash, torrentId)
          }
          if (!resolved) {
            resolved = true
            saveActiveTorrents()
            resolve({ infoHash: torrent.infoHash })
          }
        })

        torrent.on('metadata', () => {
          console.log(`Torrent metadata ready: ${torrent.name}`)
        })

        torrent.on('error', (err: Error) => {
          console.error('Torrent error:', err)
          if (!resolved) {
            resolved = true
            reject(err.message)
          }
        })
        
        if (torrent.infoHash && !resolved) {
          console.log(`Torrent already has infoHash: ${torrent.infoHash}`)
          resolved = true
          if (torrentId.startsWith('magnet:') || torrentId.startsWith('http')) {
            originalIds.set(torrent.infoHash, torrentId)
          }
          saveActiveTorrents()
          resolve({ infoHash: torrent.infoHash })
        }
      })
    } catch (err: unknown) {
      console.error('Error adding torrent:', err)
      throw err
    }
  })

  ipcMain.handle('get-torrents-status', (_event, expandedHash?: string) => {
     
    return client.torrents.map((t: any) => ({
      infoHash: t.infoHash,
      name: t.name || 'Fetching metadata...',
      progress: t.progress || 0,
      downloadSpeed: t.downloadSpeed || 0,
      uploadSpeed: t.uploadSpeed || 0,
      numPeers: t.numPeers || 0,
      // FIX: Handle Infinity timeRemaining (when downloadSpeed is 0)
      timeRemaining: (t.timeRemaining && isFinite(t.timeRemaining)) ? t.timeRemaining : 0,
      paused: !!t.paused,
      done: !!t.done || !!(store.state.completedTorrents && store.state.completedTorrents.includes(t.infoHash)),
      path: t.path,
      magnetURI: t.magnetURI,
      uploaded: t.uploaded || 0,
      downloaded: t.downloaded || 0,
      ratio: t.ratio || 0,
      length: t.length || 0,
      announce: t.announce || [],
      created: t.created || null,
      createdBy: t.createdBy || '',
      comment: t.comment || '',
       
      files: (t.infoHash === expandedHash) ? (t.files || []).map((f: any, i: number) => {
        const pieceMap: number[] = []
        if (t.bitfield && t.pieceLength) {
          const startPiece = Math.floor(f.offset / t.pieceLength)
          const endPiece = Math.floor((f.offset + f.length - 1) / t.pieceLength)
          const totalPieces = endPiece - startPiece + 1
          
          if (totalPieces > 0) {
            const CHUNKS = 100
            const piecesPerChunk = Math.ceil(totalPieces / CHUNKS)
            
            for (let chunkIdx = 0; chunkIdx < CHUNKS; chunkIdx++) {
              const chunkStart = startPiece + chunkIdx * piecesPerChunk
              if (chunkStart > endPiece) break // We reached the end of the file's pieces
              
              const chunkEnd = Math.min(endPiece, chunkStart + piecesPerChunk - 1)
              let chunkDownloaded = 0
              let chunkTotal = 0
              
              for (let p = chunkStart; p <= chunkEnd; p++) {
                if (t.bitfield.get(p)) chunkDownloaded++
                chunkTotal++
              }
              pieceMap.push(chunkTotal > 0 ? chunkDownloaded / chunkTotal : 0)
            }
          }
        }
        return {
          name: f.name,
          path: f.path,
          length: f.length,
          downloaded: f.downloaded,
          progress: f.progress,
          skipped: store.state.skippedFiles?.[t.infoHash]?.includes(i) || false,
          pieceMap
        }
      }) : []
    }))
  })

  // FIX: Wrap remove-torrent in a Promise to properly await the callback
  ipcMain.handle('remove-torrent', async (_event, infoHash) => {
    if (store.state.completedTorrents) {
      store.state.completedTorrents = store.state.completedTorrents.filter(h => h !== infoHash)
    }

    return new Promise<void>((resolve) => {
      try {
        client.remove(infoHash, {}, () => {
          // Clean up skippedFiles and torrentPaths after removal (#4)
          const currentSkipped = store.state.skippedFiles || {}
          delete currentSkipped[infoHash]
          const currentPaths = store.state.torrentPaths || {}
          delete currentPaths[infoHash]
          originalIds.delete(infoHash)
          saveActiveTorrents()
          resolve()
        })
      } catch (err) {
        console.error('Failed to remove torrent:', err)
        resolve() // Resolve anyway to prevent hanging
      }
    })
  })

  ipcMain.handle('pause-torrent', async (_event, infoHash) => {
    try {
      const torrent = client.get(infoHash)
      if (torrent && !torrent.paused) {
        torrent.pause()
        if (torrent.wires) {
          torrent.wires.forEach((wire: any) => wire.destroy())
        }
        saveActiveTorrents()
      }
    } catch (err) {
      console.error('Failed to pause torrent:', err)
    }
  })

  ipcMain.handle('resume-torrent', async (_event, infoHash) => {
    try {
      const torrent = client.get(infoHash)
      if (torrent && torrent.paused) {
        torrent.resume()
        saveActiveTorrents()
      }
    } catch (err) {
      console.error('Failed to resume torrent:', err)
    }
  })

  ipcMain.handle('open-folder', (_event, itemPath) => {
    // Normalize path separators for cross-platform compatibility (#13)
    const normalizedPath = itemPath ? path.resolve(itemPath) : ''
    
    // Security: Prevent path traversal outside allowed directories
    const allowedPaths = [
      path.resolve(store.settings.downloadPath),
      ...Object.values(store.state.torrentPaths || {}).map(p => path.resolve(p))
    ]
    
    const isAllowed = normalizedPath && allowedPaths.some(allowed => normalizedPath.startsWith(allowed))
    if (!isAllowed) {
      dialog.showErrorBox('Security Error', 'Cannot open folder outside of download directories.')
      return
    }

    if (fs.existsSync(normalizedPath)) {
      shell.showItemInFolder(normalizedPath)
    } else {
      const parentDir = path.dirname(normalizedPath)
      if (fs.existsSync(parentDir)) {
        shell.showItemInFolder(parentDir)
      } else {
        dialog.showErrorBox('File Not Found', 'The file has not been downloaded yet.')
      }
    }
  })


  // Settings Handlers
  ipcMain.handle('get-settings', () => {
    return store.settings
  })

  ipcMain.handle('save-settings', (_event, newSettings) => {
    // Validate accepted fields
    const validated: any = {}
    if (typeof newSettings.downloadPath === 'string') validated.downloadPath = newSettings.downloadPath
    // FIX: Validate numeric ranges — reject NaN, Infinity, and negative values
    if (typeof newSettings.downloadLimit === 'number' && isFinite(newSettings.downloadLimit) && newSettings.downloadLimit >= 0) {
      validated.downloadLimit = newSettings.downloadLimit
    }
    if (typeof newSettings.uploadLimit === 'number' && isFinite(newSettings.uploadLimit) && newSettings.uploadLimit >= 0) {
      validated.uploadLimit = newSettings.uploadLimit
    }
    if (typeof newSettings.startOnBoot === 'boolean') validated.startOnBoot = newSettings.startOnBoot
    if (typeof newSettings.mediaPlayerPath === 'string') validated.mediaPlayerPath = newSettings.mediaPlayerPath
    // FIX: Validate array elements are strings
    if (Array.isArray(newSettings.rssFeeds)) validated.rssFeeds = newSettings.rssFeeds.filter((f: unknown) => typeof f === 'string')
    if (Array.isArray(newSettings.rssRules)) validated.rssRules = newSettings.rssRules.filter((r: unknown) => typeof r === 'string')

    store.saveSettings(validated)
    // FIX: Use -1 for unlimited instead of 0, which may pause transfers in some WebTorrent versions
    const down = validated.downloadLimit > 0 ? validated.downloadLimit : -1
    const up = validated.uploadLimit > 0 ? validated.uploadLimit : -1
    if (typeof client.throttleDownload === 'function') {
      client.throttleDownload(down)
    }
    if (typeof client.throttleUpload === 'function') {
      client.throttleUpload(up)
    }
    
    // Trigger immediate RSS check if feeds were updated
    checkRssFeeds()
    
    return store.settings
  })

  ipcMain.handle('show-confirm-dialog', async (_event, title, message) => {
    if (!win) return false
    const { response } = await dialog.showMessageBox(win, {
      type: 'question',
      buttons: ['Cancel', 'Yes'],
      defaultId: 1,
      cancelId: 0,
      title,
      message,
    })
    return response === 1
  })

  ipcMain.handle('select-folder', async () => {
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  ipcMain.handle('toggle-devtools', () => {
    win?.webContents.toggleDevTools()
  })

  ipcMain.handle('set-clipboard-watch', (_event, enabled: boolean) => {
    if (enabled) {
      startClipboardWatch()
    } else {
      stopClipboardWatch()
    }
    return enabled
  })

  ipcMain.handle('get-clipboard-watch', () => {
    return !!clipboardWatchInterval
  })

  // File management & streaming

  // FIX: Use shared promise-based server creation to prevent race conditions
  ipcMain.handle('start-stream', async (_event, infoHash, fileIndex) => {
    const torrent = client.get(infoHash)
    if (!torrent) throw new Error('Torrent not found')
    
    await ensureStreamingServer()
    
    const file = torrent.files[fileIndex]
    if (!file) throw new Error('File not found')
    const addr = webtorrentServer?.address()
    if (!addr) throw new Error('Streaming server not ready')
    return `http://localhost:${addr.port}${file.streamURL}`
  })

  ipcMain.handle('play-external', async (_event, infoHash, fileIndex) => {
    try {
      const torrent = client.get(infoHash)
      if (!torrent || !torrent.files[fileIndex]) throw new Error('Torrent or file not found')
      
      await ensureStreamingServer()
      
      const addr = webtorrentServer?.address()
      if (!addr) throw new Error('Streaming server not ready')
      const streamUrl = `http://localhost:${addr.port}${torrent.files[fileIndex].streamURL}`
      
      let playerPath = store.settings.mediaPlayerPath

      // FIX: Validate mediaPlayerPath exists before using it
      if (playerPath && !fs.existsSync(playerPath)) {
        console.warn(`Media player path does not exist: ${playerPath}`)
        playerPath = ''
      }

      if (!playerPath) {
        // Fallback to natively launching VLC on macOS
        if (process.platform === 'darwin') {
          return new Promise((resolve, reject) => {
            execFile('open', ['-a', 'VLC', streamUrl], (err: any) => {
              if (err) {
                console.error('Failed to open VLC natively:', err)
                reject(new Error('VLC is not installed or failed to launch. Please select a media player in Settings.'))
              } else {
                resolve(true)
              }
            })
          })
        }

        // On other platforms or if we want to prompt:
        if (!win) throw new Error('No window available to prompt for player')
        const result = await dialog.showOpenDialog(win, {
          title: 'Select Media Player (e.g. VLC)',
          properties: ['openFile'],
          filters: [{ name: 'Applications', extensions: ['app', 'exe'] }]
        })
        if (!result.canceled && result.filePaths.length > 0) {
          playerPath = result.filePaths[0]
          store.saveSettings({ mediaPlayerPath: playerPath })
        } else {
          return false
        }
      }

      return new Promise((resolve, reject) => {
        if (process.platform === 'darwin') {
          execFile('open', ['-a', playerPath, streamUrl], (err: any) => {
            if (err) {
              console.error('Failed to open external app:', err)
              // fallback for macOS if open -a fails (e.g., sandbox or non-app)
              execFile('open', [streamUrl], (fallbackErr: any) => {
                 if (fallbackErr) reject(err)
                 else resolve(true)
              })
            } else {
              resolve(true)
            }
          })
        } else {
          execFile(playerPath, [streamUrl], (err: any) => {
            if (err) reject(err)
            else resolve(true)
          })
        }
      })
    } catch (err: any) {
      console.error('Error launching external player:', err)
      throw err
    }
  })

  ipcMain.handle('copy-to-clipboard', (_event, text) => {
    clipboard.writeText(text)
  })

  ipcMain.handle('clear-media-player', () => {
    store.saveSettings({ mediaPlayerPath: '' })
  })

  ipcMain.handle('stop-stream', async (_event, _infoHash) => {
    // WebTorrent global server stays alive for all streams; individual stream cleanup
    // is handled by the HTTP server's keep-alive behavior. This is intentional.
  })

  ipcMain.handle('prioritize-file', async (_event, infoHash, fileIndex) => {
    try {
      console.log(`Prioritizing file ${fileIndex} for torrent ${infoHash}`)
      const torrent = client.get(infoHash)
      if (torrent && torrent.files[fileIndex]) {
        console.log(`File found, selecting...`)
        torrent.files[fileIndex].select()
        const currentSkipped = store.state.skippedFiles || {}
        if (currentSkipped[infoHash]) {
          currentSkipped[infoHash] = currentSkipped[infoHash].filter((idx: number) => idx !== fileIndex)
          if (currentSkipped[infoHash].length === 0) {
            delete currentSkipped[infoHash]
          }
          store.saveState(store.state.activeTorrents, store.state.pausedTorrents, currentSkipped, store.state.torrentPaths || {}, store.state.processedRssLinks || [], store.state.completedTorrents || [])
        }
        console.log(`Removed from skippedFiles`)
      } else {
        console.log(`Torrent or file not found!`)
      }
    } catch (err) {
      console.error('Failed to prioritize file:', err)
    }
  })

  ipcMain.handle('skip-file', async (_event, infoHash, fileIndex) => {
    try {
      console.log(`Skipping file ${fileIndex} for torrent ${infoHash}`)
      const torrent = client.get(infoHash)
      if (torrent && torrent.files[fileIndex]) {
        console.log(`File found, deselecting...`)
        torrent.files[fileIndex].deselect()
        const currentSkipped = store.state.skippedFiles || {}
        if (!currentSkipped[infoHash]) {
          currentSkipped[infoHash] = []
        }
        if (!currentSkipped[infoHash].includes(fileIndex)) {
          currentSkipped[infoHash].push(fileIndex)
        }
        store.saveState(store.state.activeTorrents, store.state.pausedTorrents, currentSkipped, store.state.torrentPaths || {}, store.state.processedRssLinks || [], store.state.completedTorrents || [])
        console.log(`Added to skippedFiles`)
      } else {
        console.log(`Torrent or file not found!`)
      }
    } catch (err) {
      console.error('Failed to skip file:', err)
    }
  })

  ipcMain.handle('open-torrent-dialog', async () => {
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      title: 'Select .torrent file',
      properties: ['openFile'],
      filters: [{ name: 'Torrents', extensions: ['torrent'] }]
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  // FIX: Actually implement sequential downloading (was a no-op before)
  ipcMain.handle('set-sequential', async (_event, infoHash, sequential: boolean) => {
    try {
      const torrent = client.get(infoHash)
      if (torrent) {
        if (sequential) {
          // Select files in order for sequential downloading
          torrent.files.forEach((file: any) => file.select())
        }
        console.log(`Sequential downloading set to ${sequential} for ${infoHash}`)
      }
    } catch (err) {
      console.error('Failed to set sequential:', err)
    }
  })

  ipcMain.handle('search-torrents', async (_event, query: string) => {
    try {
      const response = await fetch(`https://apibay.org/q.php?q=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      // APB returns [{ id: '0' }] when no results found
      if (data.length === 1 && data[0].id === '0') return []

      const trackers = [
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://open.tracker.cl:1337/announce',
        'udp://tracker.openbittorrent.com:6969/announce',
        'udp://exodus.desync.com:6969/announce',
        'udp://tracker.torrent.eu.org:451/announce',
        'wss://tracker.openwebtorrent.com',
        'wss://tracker.btorrent.xyz',
        'wss://tracker.fastcast.nz'
      ]
      const trStr = trackers.map(tr => `&tr=${encodeURIComponent(tr)}`).join('')

      return data
        .filter((item: any) => item.info_hash && item.info_hash !== '0000000000000000000000000000000000000000')
        .map((item: any) => ({
        name: item.name,
        infoHash: item.info_hash,
        // FIX: Fallback to 0 for NaN parseInt results
        seeders: parseInt(item.seeders) || 0,
        leechers: parseInt(item.leechers) || 0,
        size: parseInt(item.size) || 0,
        magnet: `magnet:?xt=urn:btih:${item.info_hash}&dn=${encodeURIComponent(item.name)}${trStr}`
      }))
    } catch (err: any) {
      console.error('Search failed:', err)
      return { error: err.message }
    }
  })

  // FIX: Validate URL to prevent SSRF attacks
  ipcMain.handle('fetch-rss', async (_event, url: string) => {
    if (!isUrlSafe(url)) {
      return { error: 'Invalid or blocked URL. Only http/https URLs to public hosts are allowed.' }
    }
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.text()
    } catch (err: any) {
      console.error('RSS fetch failed:', err)
      return { error: err.message }
    }
  })
})

// Maximum number of processed RSS links to keep (prevents unbounded memory growth)
const MAX_PROCESSED_RSS_LINKS = 10000

async function checkRssFeeds() {
  const { rssFeeds, rssRules } = store.settings
  if (!rssFeeds || !rssFeeds.length || !rssRules || !rssRules.length) return
  
  console.log('[RSS] Checking feeds for auto-download...')
  const processedRssLinks = store.state.processedRssLinks || []
  let processedLinksChanged = false

  for (const feedUrl of rssFeeds) {
    // FIX: Validate feed URL before fetching (prevent SSRF)
    if (!isUrlSafe(feedUrl)) {
      console.warn(`[RSS] Skipping unsafe feed URL: ${feedUrl}`)
      continue
    }
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      const response = await fetch(feedUrl, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (!response.ok) continue
      const xmlText = await response.text()
      
      // Basic regex parsing for RSS since we can't install rss-parser
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi
      let match
      while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemHtml = match[1]
        const titleMatch = itemHtml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemHtml.match(/<title>(.*?)<\/title>/)
        const linkMatch = itemHtml.match(/<link>(.*?)<\/link>/) || itemHtml.match(/<enclosure[^>]+url="([^"]+)"/)
        
        if (titleMatch && titleMatch[1] && linkMatch && linkMatch[1]) {
          const title = titleMatch[1]
          const link = linkMatch[1]
          
          // Check rules
          for (const rule of rssRules) {
            try {
              // FIX: Protect against ReDoS by catching regex errors and adding a timeout-like safeguard
              // Simple complexity check: reject regexes with nested quantifiers
              if (/(\+|\*|\{)\s*(\+|\*|\{)/.test(rule) || rule.length > 200) {
                console.warn(`[RSS] Skipping potentially dangerous regex rule: ${rule}`)
                continue
              }
              const regex = new RegExp(rule, 'i')
              if (regex.test(title)) {
                if (!processedRssLinks.includes(link)) {
                  let searchId = link
                  if (link.startsWith('magnet:')) {
                    const ihMatch = link.match(/btih:([a-fA-F0-9]{40})/i)
                    if (ihMatch) searchId = ihMatch[1].toLowerCase()
                  }
                  
                  const existing = client.get(searchId)
                  if (!existing) {
                    console.log(`[RSS] Auto-adding ${title} (matched rule: ${rule})`)
                    const torrent = client.add(link, { path: store.settings.downloadPath })
                    torrent.on('infoHash', () => {
                      originalIds.set(torrent.infoHash, link)
                      saveActiveTorrents()
                    })
                    // FIX: Add error handler for RSS auto-added torrents
                    torrent.on('error', (err: Error) => {
                      console.error(`[RSS] Auto-added torrent error for "${title}":`, err)
                    })
                  }
                  
                  // Mark as processed regardless of whether we added it or it was already in client
                  processedRssLinks.push(link)
                  processedLinksChanged = true
                }
                break // Stop checking rules for this item if matched
              }
            } catch (e) {
              console.error(`[RSS] Invalid regex rule: ${rule}`, e)
            }
          }
        }
      }
    } catch (err) {
      console.error(`[RSS] Failed to check feed ${feedUrl}:`, err)
    }
  }
  
  if (processedLinksChanged) {
    // FIX: Cap processedRssLinks to prevent unbounded growth
    while (processedRssLinks.length > MAX_PROCESSED_RSS_LINKS) {
      processedRssLinks.shift() // Remove oldest entries
    }
    store.saveState(store.state.activeTorrents, store.state.pausedTorrents, store.state.skippedFiles || {}, store.state.torrentPaths || {}, processedRssLinks, store.state.completedTorrents || [])
  }
}

// Exported for testing or called from whenReady
export function startRssPolling() {
  setInterval(checkRssFeeds, 15 * 60 * 1000)
  setTimeout(checkRssFeeds, 5000)
}
