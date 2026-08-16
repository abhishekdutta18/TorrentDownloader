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

// Fallback for Capacitor / Mobile Browsers
if (!window.torrentApi) {
  window.torrentApi = {
    addTorrent: async () => { alert("The Torrent Engine is not yet supported on Mobile."); },
    getTorrentsStatus: async () => [],
    pauseTorrent: async () => {},
    resumeTorrent: async () => {},
    removeTorrent: async () => {},
    openFolder: async () => {},
    openTorrentDialog: async () => null,
    searchTorrents: async () => ({ error: "Not supported" } as any),
    setSequential: async () => {},
    startStream: async () => "",
    playExternal: async () => false,
    copyToClipboard: async () => {},
    getSettings: async () => ({} as any),
    saveSettings: async () => ({} as any),
    toggleDevTools: () => {},
    showConfirmDialog: async () => false,
    onClipboardMagnet: () => { return () => {}; }
  } as any;
}
