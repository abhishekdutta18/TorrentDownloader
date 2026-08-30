import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Error Boundary to prevent white-screen crashes
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App crashed:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#111827',
          color: '#f3f4f6',
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#ef4444' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#9ca3af', marginBottom: '1rem', maxWidth: '500px' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found. Check index.html has a <div id="root">.')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

if (window.ipcRenderer) {
  window.ipcRenderer.on('main-process-message', (_event: any, message: any) => {
    console.log(message)
  })
}


// Provide a web-compatible implementation of torrentApi that uses the C++ REST backend
const API_BASE = 'http://localhost:8080'; // During dev, vite proxy can be used, but hardcoded for now or use relative if served by same server
const getBase = () => (window.location.port === '5173' || window.location.port === '3000') ? API_BASE : '';

window.torrentApi = {
  addTorrent: async (magnetOrPath: string, optionsOrPath?: string | { savePath?: string, category?: string, name?: string }) => {
    let res;
    const savePath = typeof optionsOrPath === 'string' ? optionsOrPath : optionsOrPath?.savePath;
    const name = typeof optionsOrPath === 'object' ? optionsOrPath?.name : undefined;
    if (magnetOrPath.startsWith('magnet:') || magnetOrPath.startsWith('http://') || magnetOrPath.startsWith('https://')) {
      const payload: any = { magnet: magnetOrPath };
      if (savePath) payload.save_path = savePath;
      if (name) payload.name = name;
      res = await fetch(`${getBase()}/api/torrents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      // Local filesystem path (e.g. from file picker or dropped path)
      const payload: any = { path: magnetOrPath, magnet: magnetOrPath };
      if (savePath) payload.save_path = savePath;
      if (name) payload.name = name;
      res = await fetch(`${getBase()}/api/torrents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add torrent');
    return { infoHash: data.hash };
  },
  addTorrentFile: async (file: File, savePath?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (savePath) formData.append('save_path', savePath);
    const res = await fetch(`${getBase()}/api/torrents/file`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to upload torrent file');
    return { infoHash: data.hash };
  },
  getPieceInfo: async (hash: string) => {
    const res = await fetch(`${getBase()}/api/torrents/${hash}/pieces`);
    if (!res.ok) return null;
    return await res.json();
  },
  getPeerList: async (hash: string) => {
    const res = await fetch(`${getBase()}/api/torrents/${hash}/peers`);
    if (!res.ok) return [];
    return await res.json();
  },
  getTrackerList: async (hash: string) => {
    const res = await fetch(`${getBase()}/api/torrents/${hash}/trackers`);
    if (!res.ok) return [];
    return await res.json();
  },
  reannounceTracker: async (hash: string) => {
    await fetch(`${getBase()}/api/torrents/${hash}/reannounce`, { method: 'POST' });
  },
  addTracker: async (hash: string, url: string) => {
    await fetch(`${getBase()}/api/torrents/${hash}/trackers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
  },
  getSessionStats: async () => {
    try {
      const res = await fetch(`${getBase()}/api/session/stats`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return null;
  },
  getTorrentsStatus: async (hash?: string) => {
    const res = await fetch(`${getBase()}/api/torrents`);
    const data = await res.json();
    const torrents = data.map((t: any) => ({
      infoHash: t.hash,
      name: t.name,
      progress: t.progress / 100,
      downloadSpeed: t.download_speed,
      uploadSpeed: t.upload_speed,
      numPeers: t.peers,
      numSeeds: t.seeders,
      state: t.state,
      paused: t.paused || t.state === 'paused',
      done: t.done || t.progress >= 100 || t.state === 'seeding' || t.state === 'finished',
      downloaded: t.downloaded || 0,
      length: t.length || 0,
      uploaded: t.uploaded || 0,
      path: t.save_path || '',
      magnetURI: t.magnet_uri || `magnet:?xt=urn:btih:${t.hash}`,
      timeRemaining: t.eta || 0
    }));

    if (hash) {
      const target = torrents.find((t: any) => t.infoHash === hash);
      if (target) {
        try {
          const [filesRes, trackersRes] = await Promise.all([
            fetch(`${getBase()}/api/torrents/${hash}/files`),
            fetch(`${getBase()}/api/torrents/${hash}/trackers`)
          ]);
          if (filesRes.ok) {
            const files = await filesRes.json();
            target.files = files.map((f: any) => ({
              name: f.name,
              path: f.path,
              length: f.size,
              progress: f.progress
            }));
          }
          if (trackersRes.ok) {
            const trackers = await trackersRes.json();
            target.announce = trackers.map((tr: any) => tr.url);
          }
        } catch (e) {
          console.warn('Failed to fetch details for expanded torrent:', e);
        }
      }
    }

    return torrents;
  },
  pauseTorrent: async (hash: string) => {
    await fetch(`${getBase()}/api/torrents/${hash}/pause`, { method: 'POST' });
  },
  resumeTorrent: async (hash: string) => {
    await fetch(`${getBase()}/api/torrents/${hash}/resume`, { method: 'POST' });
  },
  stopTorrent: async (hash: string) => {
    await fetch(`${getBase()}/api/torrents/${hash}/stop`, { method: 'POST' });
  },
  pauseAllTorrents: async () => {
    await fetch(`${getBase()}/api/torrents/pause_all`, { method: 'POST' });
  },
  resumeAllTorrents: async () => {
    await fetch(`${getBase()}/api/torrents/resume_all`, { method: 'POST' });
  },
  stopAllTorrents: async () => {
    await fetch(`${getBase()}/api/torrents/stop_all`, { method: 'POST' });
  },
  removeTorrent: async (hash: string) => {
    await fetch(`${getBase()}/api/torrents/${hash}`, { method: 'DELETE' });
  },
  openFolder: async (pathOrHash: string) => {
    try {
      await fetch(`${getBase()}/api/torrents/${pathOrHash}/open_folder`, { method: 'POST' });
    } catch (e) {
      console.warn('Failed to open folder:', e);
    }
  },
  openTorrentDialog: async () => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.torrent';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return resolve(null);
        
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch(`${getBase()}/api/torrents/file`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (res.ok) resolve('torrent-added-via-file');
      };
      input.click();
    });
  },
  searchTorrents: async (query: string) => {
    const res = await fetch(`${getBase()}/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
        throw new Error(await res.text() || res.statusText);
    }
    const text = await res.text();
    const results: any[] = [];
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr) {
                try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed && typeof parsed === 'object') {
                        if (!parsed.infoHash && parsed.magnet) {
                            const match = parsed.magnet.match(/xt=urn:btih:([a-zA-Z0-9]+)/i);
                            if (match) parsed.infoHash = match[1].toLowerCase();
                        } else if (parsed.infoHash) {
                            parsed.infoHash = parsed.infoHash.toLowerCase();
                        }
                        results.push(parsed);
                    }
                } catch (e) {
                    console.warn('Failed to parse search SSE line:', dataStr, e);
                }
            }
        }
    }
    return results;
  },
  setSequential: async (hash: string, seq: boolean) => {
    await fetch(`${getBase()}/api/torrents/${hash}/sequential`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sequential: seq })
    });
  },
  startStream: async (hash: string, fileIndex: number) => {
    return `${getBase()}/api/stream/${hash}/${fileIndex}`;
  },
  playExternal: async (hash: string, fileIndex: number) => {
    await fetch(`${getBase()}/api/torrents/${hash}/files/${fileIndex}/play`, { method: 'POST' });
    return true;
  },
  copyToClipboard: async (text: string) => {
    navigator.clipboard.writeText(text);
  },
  getSettings: async () => {
    const res = await fetch(`${getBase()}/api/settings`);
    return await res.json();
  },
  saveSettings: async (settings: Partial<AppSettings>) => {
    const res = await fetch(`${getBase()}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return await res.json();
  },
  toggleDevTools: async () => {},
  showConfirmDialog: async (msg: string) => confirm(msg),
  onClipboardMagnet: (cb: any) => { return () => {}; },
  setClipboardWatch: async () => false,
  getClipboardWatch: async () => false,
  clearMediaPlayer: async () => {},
  stopStream: async () => {},
  prioritizeFile: async (hash: string, index: number) => {
    try {
      const filesRes = await fetch(`${getBase()}/api/torrents/${hash}/files`);
      if (filesRes.ok) {
        const files = await filesRes.json();
        const priorities = files.map((f: any, i: number) => i === index ? 7 : (f.priority ?? 4));
        await fetch(`${getBase()}/api/torrents/${hash}/files`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priorities })
        });
      }
    } catch (e) {
      console.warn('Failed to prioritize file:', e);
    }
  },
  skipFile: async (hash: string, index: number) => {
    try {
      const filesRes = await fetch(`${getBase()}/api/torrents/${hash}/files`);
      if (filesRes.ok) {
        const files = await filesRes.json();
        const priorities = files.map((f: any, i: number) => i === index ? 0 : (f.priority ?? 4));
        await fetch(`${getBase()}/api/torrents/${hash}/files`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priorities })
        });
      }
    } catch (e) {
      console.warn('Failed to skip file:', e);
    }
  },
  fetchRss: async () => [],
  seedFolder: async (path: string) => { return ""; },
  selectFolder: async () => {
    return prompt('Enter absolute save path (e.g. /Users/name/Downloads):', '') || '';
  },
  readClipboard: async () => {
    try {
      if (navigator.clipboard?.readText) {
        return (await navigator.clipboard.readText()).trim();
      }
    } catch (_) {}
    return '';
  }
}
