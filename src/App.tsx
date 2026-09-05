import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { 
  Play, Pause, Plus, HardDrive, Settings, Activity, FolderOpen, 
  Copy, ArrowDown, ArrowUp, Trash2, MonitorPlay, Square, 
  Search, BarChart2, Check, Loader2, X, ExternalLink, Filter, Film, Layers,
  TrendingUp, Wifi, Globe, ShieldCheck, ShieldAlert, ShieldX, Shield, AlertTriangle, Database, Zap, Sparkles
} from 'lucide-react'
import './App.css'
import { Settings as SettingsComponent } from './components/Settings'
import { VideoPlayer } from './components/VideoPlayer'
import { sanitizeMagnetInput } from './utils'

interface TorrentFile {
  name: string
  length: number
  downloaded: number
  progress: number
  skipped: boolean
  pieceMap?: number[]
  path?: string
  priority?: number
  securityStatus?: 'clean' | 'suspicious' | 'infected' | 'scanning' | 'untested'
  threatName?: string
  sha256?: string
  isRiskyType?: boolean
  isDoubleExtension?: boolean
  securityDetails?: string
}

interface Torrent {
  infoHash: string
  name: string
  progress: number
  downloadSpeed: number
  uploadSpeed: number
  numPeers: number
  numSeeds?: number
  state?: string
  timeRemaining: number
  paused: boolean
  done: boolean
  path?: string
  magnetURI?: string
  uploaded: number
  downloaded: number
  ratio: number
  length: number
  announce: string[]
  created?: string | Date
  createdBy?: string
  comment?: string
  files: TorrentFile[]
  category?: string
}

function formatBytes(bytes: number, decimals = 2) {
  if (!bytes || bytes <= 0 || !isFinite(bytes)) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  if (i < 0 || i >= sizes.length) return '0 B'
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function formatTime(secondsOrMs: number) {
  if (!secondsOrMs || secondsOrMs <= 0 || !isFinite(secondsOrMs) || isNaN(secondsOrMs)) return 'Calculating...'
  // In libtorrent, ETA is provided in seconds. In legacy WebTorrent, it was ms.
  // Values > 100,000 are treated as milliseconds.
  const s = secondsOrMs > 100000 ? Math.floor(secondsOrMs / 1000) : Math.floor(secondsOrMs)
  if (s <= 0) return 'Calculating...'
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const remS = s % 60
  if (m < 60) return `${m}m ${remS}s`
  const h = Math.floor(m / 60)
  const remM = m % 60
  if (h < 24) return `${h}h ${remM}m`
  const d = Math.floor(h / 24)
  const remH = h % 24
  return `${d}d ${remH}h`
}

function App() {
  const [torrents, setTorrents] = useState<Torrent[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [magnetLink, setMagnetLink] = useState('')
  const [customSavePath, setCustomSavePath] = useState('')
  const [error, setError] = useState('')
  type Tab = 'downloading' | 'completed' | 'studio' | 'search' | 'stats' | 'settings'
  const [activeTab, setActiveTab] = useState<Tab>('downloading')
  const [playerModal, setPlayerModal] = useState<{
    streamUrl: string
    title: string
    infoHash?: string
    fileIndex?: number
  } | null>(null)
  const [clipboardMagnet, setClipboardMagnet] = useState<string | null>(null)
  const [isAllStopped, setIsAllStopped] = useState(false)
  
  // Category Filtering & Automation State
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [editingCategoryTorrent, setEditingCategoryTorrent] = useState<{ hash: string, currentCategory: string } | null>(null)
  const [newCategoryInput, setNewCategoryInput] = useState('')
  const [addCategory, setAddCategory] = useState('')
  
  // Side Panel Inspector State
  const [inspectorHash, setInspectorHash] = useState<string | null>(null)
  const [inspectorTab, setInspectorTab] = useState<'files' | 'peers' | 'trackers' | 'pieces' | 'ai'>('files')
  const [mediaAIData, setMediaAIData] = useState<any>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [copiedAIFilename, setCopiedAIFilename] = useState(false)
  const [securityModal, setSecurityModal] = useState<{
    title: string
    fileName: string
    isMalware: boolean
    threatName?: string
    details?: string
    onConfirm: () => void
  } | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<{
    hash: string
    top: number
    right: number
    bottom: number
  } | null>(null)

  const clipboardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inspectorHashRef = useRef<string | null>(null)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [copiedMagnetHash, setCopiedMagnetHash] = useState<string | null>(null)
  const [searchSort, setSearchSort] = useState<'seeds' | 'size_desc' | 'size_asc' | 'name'>('seeds')
  const [searchResultFilter, setSearchResultFilter] = useState('')
  const [addingMagnetHash, setAddingMagnetHash] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'progress' | 'speed' | 'added'>('added')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterText, setFilterText] = useState('')

  // Speed history for chart (last 60 seconds) & Peak tracking
  const [speedHistory, setSpeedHistory] = useState<{down: number, up: number, time: number}[]>([])
  const [peakDown, setPeakDown] = useState(0)
  const [peakUp, setPeakUp] = useState(0)

  // Real Libtorrent Telemetry State
  const [sessionStats, setSessionStats] = useState<any>(null)
  const [pieceInfo, setPieceInfo] = useState<{ num_pieces: number; piece_length: number; bitfield: string; availability: number[] } | null>(null)

  // RSS state
  const [rssItems, setRssItems] = useState<any[]>([])
  const [isRefreshingRss, setIsRefreshingRss] = useState(false)

  // Piece & peer telemetry states
  const [pieceData, setPieceData] = useState<any | null>(null)
  const [peerList, setPeerList] = useState<any[]>([])
  const [trackerList, setTrackerList] = useState<any[]>([])
  const [newTrackerUrl, setNewTrackerUrl] = useState('')
  const [isAddingTracker, setIsAddingTracker] = useState(false)

  useEffect(() => {
    inspectorHashRef.current = inspectorHash
  }, [inspectorHash])

  useEffect(() => {
    if (inspectorTab === 'ai' && inspectorHash) {
      setLoadingAI(true)
      fetch(`http://localhost:8080/api/torrents/${inspectorHash}/media_ai`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            setMediaAIData(data)
          }
        })
        .catch(() => {})
        .finally(() => setLoadingAI(false))
    }
  }, [inspectorTab, inspectorHash])

  useEffect(() => {
    if (!menuAnchor) return
    const handleDismiss = () => setMenuAnchor(null)
    window.addEventListener('resize', handleDismiss)
    return () => window.removeEventListener('resize', handleDismiss)
  }, [menuAnchor])

  useEffect(() => {
    // Poll for torrents status immediately on mount and every second
    const fetchStatus = async () => {
      try {
        if (window.torrentApi) {
          const status = await window.torrentApi.getTorrentsStatus(inspectorHashRef.current || undefined)
          setTorrents(status as unknown as Torrent[])
          
          let totalDown = 0
          let totalUp = 0
          for (const t of (status as unknown as Torrent[])) {
            totalDown += (t.downloadSpeed || 0)
            totalUp += (t.uploadSpeed || 0)
          }

          setPeakDown(prev => Math.max(prev, totalDown))
          setPeakUp(prev => Math.max(prev, totalUp))

          setSpeedHistory(prev => {
            const now = Date.now()
            const updated = [...prev, { down: totalDown, up: totalUp, time: now }]
            if (updated.length > 60) updated.shift()
            return updated
          })

          if (window.torrentApi.getSessionStats) {
            const stats = await window.torrentApi.getSessionStats()
            if (stats) setSessionStats(stats)
          }

          if (inspectorHashRef.current) {
            const hash = inspectorHashRef.current
            if (window.torrentApi.getPieceInfo) {
              const p = await window.torrentApi.getPieceInfo(hash)
              setPieceInfo(p)
            }
            if (window.torrentApi.getPeerList) {
              const peers = await window.torrentApi.getPeerList(hash)
              setPeerList(peers)
            }
            if (window.torrentApi.getTrackerList) {
              const trs = await window.torrentApi.getTrackerList(hash)
              setTrackerList(trs)
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch torrents", err)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 1000)

    let cleanupClipboard: (() => void) | undefined
    if (window.torrentApi && window.torrentApi.onClipboardMagnet) {
      cleanupClipboard = window.torrentApi.onClipboardMagnet((magnet) => {
        if (magnet && magnet.startsWith('magnet:?xt=urn:btih:')) {
          setMagnetLink(magnet)
          setShowAddModal(true)
        }
      })
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      const text = e.dataTransfer?.getData('text/plain') || e.dataTransfer?.getData('text/uri-list')
      if (text) {
        const sanitized = sanitizeMagnetInput(text)
        if (sanitized.startsWith('magnet:?') || sanitized.startsWith('http://') || sanitized.startsWith('https://')) {
          try {
            if (window.torrentApi) {
              await window.torrentApi.addTorrent(sanitized)
              setActiveTab('downloading')
            }
            return
          } catch (err) {
            console.error('Failed to add dropped link:', err)
          }
        }
      }

      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i] as File & { path?: string }
          if (file.name.endsWith('.torrent')) {
            try {
              if (window.torrentApi) {
                if (file.path) {
                  await window.torrentApi.addTorrent(file.path)
                } else if (window.torrentApi.addTorrentFile) {
                  await window.torrentApi.addTorrentFile(file)
                }
              }
            } catch (err) {
              console.error('Failed to add dropped torrent:', err)
            }
          }
        }
      }
    }

    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)

    const currentTimer = clipboardTimerRef.current
    return () => {
      clearInterval(interval)
      if (cleanupClipboard) cleanupClipboard()
      if (currentTimer) clearTimeout(currentTimer)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [])

  // Helper to determine the best playable video file
  const getBestPlayableFile = async (infoHash: string): Promise<{ index: number, name: string }> => {
    try {
      const base = (window.location.port === '5173' || window.location.port === '3000') ? 'http://localhost:8080' : ''
      const res = await fetch(`${base}/api/torrents/${infoHash}/files`)
      if (res.ok) {
        const files: any[] = await res.json()
        if (files && files.length > 0) {
          const videoExts = ['.mp4', '.mkv', '.webm', '.avi', '.mov', '.m4v', '.mp3', '.flac', '.ts']
          const videoFile = files.find(f => videoExts.some(ext => (f.name || f.path || '').toLowerCase().endsWith(ext)))
          if (videoFile) {
            return { index: videoFile.index ?? 0, name: videoFile.name || 'video.mp4' }
          }
          const sorted = [...files].sort((a, b) => (b.size || 0) - (a.size || 0))
          if (sorted[0]) {
            return { index: sorted[0].index ?? 0, name: sorted[0].name || 'media' }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to detect best playable file:', e)
    }
    return { index: 0, name: 'video.mp4' }
  }

  const handleScanFile = async (hash: string, fileIndex: number) => {
    try {
      if (window.torrentApi?.scanFile) {
        await window.torrentApi.scanFile(hash, fileIndex)
      } else {
        const base = (window.location.port === '5173' || window.location.port === '3000') ? 'http://localhost:8080' : ''
        await fetch(`${base}/api/torrents/${hash}/files/${fileIndex}/scan`, { method: 'POST' })
      }
    } catch (e) {
      console.warn('Failed to trigger scan:', e)
    }
  }

  // In-process OmniPlayer & In-App Video Streaming Launcher
  const playInOmniPlayer = async (infoHash: string, fileIndex?: number, title?: string, fileSecurity?: { status?: string, threatName?: string, isRisky?: boolean }) => {
    let targetIdx = fileIndex
    let targetName = ''

    if (targetIdx === undefined) {
      const best = await getBestPlayableFile(infoHash)
      targetIdx = best.index
      targetName = best.name
    } else {
      targetName = title || 'video.mp4'
    }

    const startPlay = () => {
      let safePlaybackName = targetName
      if (!/\.[a-z0-9]{2,4}$/i.test(safePlaybackName)) {
        safePlaybackName = safePlaybackName + '.mp4'
      }

      const base = (window.location.port === '5173' || window.location.port === '3000') ? 'http://localhost:8080' : ''
      const safeTitle = encodeURIComponent(safePlaybackName)
      const streamUrl = `${base}/api/stream/${infoHash}/${targetIdx}/${safeTitle}`

      setPlayerModal({
        streamUrl,
        title: safePlaybackName,
        infoHash,
        fileIndex: targetIdx
      })
    }

    // Execution Guard: prompt confirmation before playing suspicious or malware-infected files
    const targetTorrent = torrents.find(t => t.infoHash === infoHash)
    const targetFile = targetTorrent?.files?.[targetIdx ?? 0]
    const status = fileSecurity?.status || targetFile?.securityStatus
    const isRisky = fileSecurity?.isRisky || targetFile?.isRiskyType || /\.(exe|scr|bat|cmd|ps1|vbs|msi|iso|dmg|pkg)$/i.test(targetName)
    const isMalware = status === 'infected'

    if (isMalware || isRisky) {
      setSecurityModal({
        title: isMalware ? 'Malware Threat Warning' : 'Suspicious Executable Warning',
        fileName: targetName,
        isMalware,
        threatName: fileSecurity?.threatName || targetFile?.threatName,
        details: isMalware 
          ? `Threat intelligence identified "${fileSecurity?.threatName || targetFile?.threatName || 'Malicious payload'}" in this file.`
          : 'This file is an executable or script. Opening or streaming executable files may execute code on your computer.',
        onConfirm: () => {
          setSecurityModal(null)
          startPlay()
        }
      })
      return
    }

    startPlay()
  }

  const openOmniPlayerStudio = () => {
    if ((window as any).webkit?.messageHandlers?.omniPlayer) {
      (window as any).webkit.messageHandlers.omniPlayer.postMessage({ action: "openStudio" })
    } else {
      setActiveTab('studio')
    }
  }

  const handleUniversalStop = async () => {
    if (isAllStopped) {
      handleResumeAll()
      setIsAllStopped(false)
    } else {
      handleStopAll()
      setIsAllStopped(true)
    }
  }

  const handleAddTorrent = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const target = sanitizeMagnetInput(magnetLink)
    if (!target) return

    if (!target.startsWith('magnet:?') && !target.startsWith('http://') && !target.startsWith('https://')) {
      setError('Please enter a valid magnet link, info hash, or .torrent URL')
      return
    }

    try {
      setError('')
      if (window.torrentApi) {
        const res = await window.torrentApi.addTorrent(target, customSavePath || undefined)
        if (res && res.infoHash) {
          if (addCategory.trim()) {
            await handleSaveCategory(res.infoHash, addCategory.trim())
          }
          const existing = torrents.find(t => t.infoHash === res.infoHash)
          if (existing && existing.done) {
            setActiveTab('completed')
            setInspectorHash(res.infoHash)
          } else {
            setActiveTab('downloading')
            setInspectorHash(res.infoHash)
          }
        }
      }
      setMagnetLink('')
      setAddCategory('')
      setShowAddModal(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleSaveCategory = async (hash: string, category: string) => {
    try {
      if (window.torrentApi?.setCategory) {
        await window.torrentApi.setCategory(hash, category)
      } else {
        const base = (window.location.port === '5173' || window.location.port === '3000') ? 'http://localhost:8080' : ''
        await fetch(`${base}/api/torrents/${hash}/category`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category })
        })
      }
      setTorrents(prev => prev.map(t => t.infoHash === hash ? { ...t, category } : t))
      setEditingCategoryTorrent(null)
    } catch (err) {
      console.warn('Failed to update category:', err)
    }
  }

  const handlePauseAll = () => {
    if (window.torrentApi) {
      if (window.torrentApi.pauseAllTorrents) {
        window.torrentApi.pauseAllTorrents().catch(console.error)
      } else {
        displayedTorrents.forEach(t => {
          if (!t.paused) window.torrentApi.pauseTorrent(t.infoHash).catch(console.error)
        })
      }
    }
  }

  const handleResumeAll = () => {
    if (window.torrentApi) {
      if (window.torrentApi.resumeAllTorrents) {
        window.torrentApi.resumeAllTorrents().catch(console.error)
      } else {
        displayedTorrents.forEach(t => {
          if (t.paused) window.torrentApi.resumeTorrent(t.infoHash).catch(console.error)
        })
      }
    }
  }

  const handleStopAll = () => {
    if (window.torrentApi) {
      if (window.torrentApi.stopAllTorrents) {
        window.torrentApi.stopAllTorrents().catch(console.error)
      } else {
        displayedTorrents.forEach(t => {
          if (window.torrentApi.stopTorrent) {
            window.torrentApi.stopTorrent(t.infoHash).catch(console.error)
          } else {
            window.torrentApi.pauseTorrent(t.infoHash).catch(console.error)
          }
        })
      }
    }
  }

  const handleStop = (infoHash: string) => {
    if (window.torrentApi) {
      if (window.torrentApi.stopTorrent) {
        window.torrentApi.stopTorrent(infoHash).catch(console.error)
      } else {
        window.torrentApi.pauseTorrent(infoHash).catch(console.error)
      }
    }
  }

  const handleRemove = async (infoHash: string, name: string) => {
    if (window.torrentApi) {
      const confirmed = await window.torrentApi.showConfirmDialog(
        'Delete Torrent',
        `Delete "${name}"? This removes it from the list (downloaded files remain on disk).`
      )
      if (!confirmed) return
      try {
        await window.torrentApi.removeTorrent(infoHash)
        if (inspectorHash === infoHash) setInspectorHash(null)
      } catch (err) {
        console.error('Failed to remove torrent:', err)
      }
    }
  }

  const handleReannounce = async (hash: string) => {
    if (window.torrentApi?.reannounceTracker) {
      await window.torrentApi.reannounceTracker(hash)
      const trs = await window.torrentApi.getTrackerList?.(hash)
      if (trs) setTrackerList(trs)
    }
  }

  const handleAddTracker = async (e: React.FormEvent, hash: string) => {
    e.preventDefault()
    if (!newTrackerUrl.trim() || !window.torrentApi?.addTracker) return
    try {
      setIsAddingTracker(true)
      await window.torrentApi.addTracker(hash, newTrackerUrl.trim())
      setNewTrackerUrl('')
      const trs = await window.torrentApi.getTrackerList?.(hash)
      if (trs) setTrackerList(trs)
    } catch (err) {
      console.error(err)
    } finally {
      setIsAddingTracker(false)
    }
  }

  const handleSetPriority = async (hash: string, index: number, priority: number) => {
    try {
      if (priority === 0 && window.torrentApi?.skipFile) {
        await window.torrentApi.skipFile(hash, index)
      } else if (priority === 7 && window.torrentApi?.prioritizeFile) {
        await window.torrentApi.prioritizeFile(hash, index)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleOpenAddModal = async () => {
    setError('')
    setShowAddModal(true)
    let initial = ''
    try {
      let clip = ''
      if (window.torrentApi?.readClipboard) {
        clip = await window.torrentApi.readClipboard()
      } else if (navigator.clipboard) {
        clip = await navigator.clipboard.readText()
      }
      if (clip) {
        const sanitized = sanitizeMagnetInput(clip)
        if (sanitized.startsWith('magnet:?') || sanitized.startsWith('http://') || sanitized.startsWith('https://')) {
          initial = sanitized
        }
      }
    } catch {
      // Ignore clipboard read errors
    }
    setMagnetLink(initial)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (!query) return
    setIsSearching(true)
    setSearchError('')
    setSearchResults([])
    setHasSearched(true)
    try {
      if (window.torrentApi) {
        const results = await window.torrentApi.searchTorrents(query)
        if (Array.isArray(results)) {
          setSearchResults(results)
        } else if (results && (results as any).error) {
          throw new Error((results as any).error)
        } else {
          setSearchResults([])
        }
      }
    } catch (err: any) {
      setSearchError(err.message || 'Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const handleCopyMagnet = async (magnet: string, key: string) => {
    if (!magnet) return
    try {
      if (window.torrentApi?.copyToClipboard) {
        await window.torrentApi.copyToClipboard(magnet)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(magnet)
      }
      setCopiedMagnetHash(key)
      setTimeout(() => {
        setCopiedMagnetHash(prev => (prev === key ? null : prev))
      }, 2000)
    } catch (e) {
      console.warn('Failed to copy magnet link:', e)
    }
  }

  const handleDownloadFromSearch = async (res: any, key: string) => {
    if (!window.torrentApi || !res.magnet) return
    setAddingMagnetHash(key)
    try {
      const result = await window.torrentApi.addTorrent(res.magnet, { name: res.name })
      if (result && result.infoHash) {
        setInspectorHash(result.infoHash)
      }
      setActiveTab('downloading')
    } catch (e: any) {
      setSearchError(e.message || 'Failed to add torrent')
    } finally {
      setAddingMagnetHash(null)
    }
  }

  const getExistingTorrent = (res: any) => {
    if (!res) return null
    const hash = (res.infoHash || '').toLowerCase()
    if (!hash) return null
    return torrents.find(t => (t.infoHash || '').toLowerCase() === hash) || null
  }

  const downloadingCount = torrents.filter(t => !t.done).length
  const completedCount = torrents.filter(t => t.done).length
  const activeDownloadingSwarms = torrents.filter(t => !t.done && !t.paused && t.downloadSpeed > 0).length
  const activeSeedingSwarms = torrents.filter(t => t.done && !t.paused && t.uploadSpeed > 0).length
  const pausedSwarms = torrents.filter(t => t.paused).length

  // Aggregated Statistics Metrics
  const totalDownloaded = torrents.reduce((acc, t) => acc + (t.downloaded || 0), 0)
  const totalUploaded = torrents.reduce((acc, t) => acc + (t.uploaded || 0), 0)
  const totalWanted = torrents.reduce((acc, t) => acc + (t.length || 0), 0)
  const globalRatio = totalDownloaded > 0 ? (totalUploaded / totalDownloaded) : 0
  const totalPeers = torrents.reduce((acc, t) => acc + (t.numPeers || 0), 0)
  const totalSeeds = torrents.reduce((acc, t) => acc + (t.numSeeds || 0), 0)

  // Dynamic categories and category counts
  const availableCategories = Array.from(new Set([
    'movies',
    'tv',
    'music',
    'software',
    'sonarr',
    'radarr',
    ...torrents.map(t => (t.category || '').toLowerCase().trim()).filter(Boolean)
  ])).sort()

  const categoryCounts = torrents.reduce((acc, t) => {
    const cat = (t.category || '').toLowerCase().trim()
    if (cat) {
      acc[cat] = (acc[cat] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const displayedTorrents = torrents.filter(t => {
    if (activeTab === 'downloading') return !t.done
    if (activeTab === 'completed') return t.done
    return true
  }).filter(t => {
    if (selectedCategory === 'all') return true
    if (selectedCategory === 'uncategorized') return !t.category || t.category.trim() === ''
    return (t.category || '').toLowerCase().trim() === selectedCategory.toLowerCase().trim()
  }).filter(t => {
    if (!filterText) return true
    return (t.name || '').toLowerCase().includes(filterText.toLowerCase())
  }).sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'name') cmp = (a.name || '').localeCompare(b.name || '');
    else if (sortBy === 'size') cmp = a.length - b.length;
    else if (sortBy === 'progress') cmp = a.progress - b.progress;
    else if (sortBy === 'speed') cmp = (a.downloadSpeed + a.uploadSpeed) - (b.downloadSpeed + b.uploadSpeed);
    else if (sortBy === 'added') {
        const dateA = a.created ? new Date(a.created).getTime() : 0;
        const dateB = b.created ? new Date(b.created).getTime() : 0;
        cmp = dateA - dateB;
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  })

  const currentInspectorTorrent = torrents.find(t => t.infoHash === inspectorHash) || null

  const filteredAndSortedSearchResults = searchResults
    .filter((item: any) => {
      if (!searchResultFilter.trim()) return true
      const term = searchResultFilter.toLowerCase()
      return (item.name || '').toLowerCase().includes(term) || (item.source || '').toLowerCase().includes(term)
    })
    .sort((a: any, b: any) => {
      if (searchSort === 'seeds') return (b.seeders || 0) - (a.seeders || 0)
      if (searchSort === 'size_desc') return (b.size || 0) - (a.size || 0)
      if (searchSort === 'size_asc') return (a.size || 0) - (b.size || 0)
      if (searchSort === 'name') return (a.name || '').localeCompare(b.name || '')
      return 0
    })

  const latestDownSpeed = speedHistory.length > 0 ? speedHistory[speedHistory.length - 1].down : 0
  const latestUpSpeed = speedHistory.length > 0 ? speedHistory[speedHistory.length - 1].up : 0

  return (
    <div className="w-screen h-screen flex flex-col glass-window overflow-hidden select-none relative bg-gradient-to-br from-slate-100/90 via-sky-50/40 to-slate-100/90 text-slate-900 font-sans">
      
      {/* Ambient Daylight Optical Orbs behind glass */}
      <div className="fixed top-[-10%] right-[-5%] w-[450px] h-[450px] bg-sky-200/30 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-100/35 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Apple Light Frosted Titlebar - Edge-to-Edge Native Mac Integration */}
      <header className="h-13 w-full border-b border-slate-200/60 px-4 flex items-center justify-between bg-white/40 backdrop-blur-xl relative z-20 [-webkit-app-region:drag]">
        
        {/* Left Section: Offset for macOS Native Traffic Lights + Brand */}
        <div className="flex items-center gap-2.5 ml-20 [-webkit-app-region:no-drag]">
          <img src="/logo.png" alt="OmniFlux" className="w-5 h-5 rounded-md object-contain shadow-xs" />
          <span className="text-xs font-extrabold tracking-tight text-slate-800">
            OmniFlux
          </span>
        </div>

        {/* Minimal Center Search Pill */}
        <div className="relative w-80 [-webkit-app-region:no-drag]">
          <input 
            type="text" 
            placeholder="Search or filter transfers..." 
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="w-full bg-white/70 hover:bg-white/95 focus:bg-white border border-white/90 rounded-full text-xs py-1.5 pl-8 pr-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 shadow-2xs transition" 
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
        </div>

        {/* Right Header Controls: Speeds + Universal Stop + Add */}
        <div className="flex items-center gap-2.5 [-webkit-app-region:no-drag]">
          {/* Speed Counters */}
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600 bg-white/70 border border-white/90 px-3 py-1 rounded-full shadow-2xs">
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{formatBytes(latestDownSpeed)}/s</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-blue-600 font-medium">
              {formatBytes(latestUpSpeed)}/s
            </span>
          </div>

          {/* Universal Stop All Button */}
          <button 
            onClick={handleUniversalStop}
            className={`glass-btn text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition active:scale-[0.98] shadow-2xs ${
              isAllStopped 
                ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200/80' 
                : 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200/80'
            }`}
            title={isAllStopped ? "Resume All Transfers" : "Universal Stop: Immediately halts all active torrent downloads and uploads"}
          >
            {isAllStopped ? (
              <>
                <Play size={10} className="fill-current text-emerald-600" /> Resume All
              </>
            ) : (
              <>
                <Square size={9} className="fill-current text-red-600" /> Stop All
              </>
            )}
          </button>

          {/* Add Torrent Button */}
          <button 
            onClick={handleOpenAddModal}
            className="glass-btn-primary text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1 transition active:scale-[0.98]"
          >
            <Plus size={14} />
            <span>Add</span>
          </button>
        </div>
      </header>

      {/* Main App Workspace */}
      <div className="flex flex-1 overflow-hidden min-h-0 relative z-10">
        
        {/* Full-Height Minimal Frosted Sidebar */}
        <div className="w-52 glass-sidebar p-3.5 flex flex-col justify-between select-none border-r border-slate-200/60">
          <nav className="space-y-1 text-xs">
            <button 
              onClick={() => { setActiveTab('downloading'); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold transition-all ${
                activeTab === 'downloading' 
                  ? 'text-blue-700 bg-white/95 border border-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-blue-600">⚡</span>
                <span>Transfers</span>
              </div>
              {downloadingCount > 0 && (
                <span className="font-mono text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">
                  {downloadingCount}
                </span>
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('completed'); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'completed' 
                  ? 'text-blue-700 bg-white/95 border border-white shadow-2xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                <span>Completed</span>
              </div>
              {completedCount > 0 && (
                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                  {completedCount}
                </span>
              )}
            </button>

            <button 
              onClick={openOmniPlayerStudio}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-indigo-700 hover:bg-white/50 transition-all font-bold group"
            >
              <div className="flex items-center gap-2">
                <span>🎬</span>
                <span>OmniPlayer</span>
              </div>
              <span className="text-[10px] text-indigo-400 group-hover:translate-x-0.5 transition-transform">▶</span>
            </button>

            <button 
              onClick={() => { setActiveTab('search'); }}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'search' 
                  ? 'text-blue-700 bg-white/95 border border-white shadow-2xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Search size={14} className="text-slate-400" />
              <span>Search</span>
            </button>

            <button 
              onClick={() => { setActiveTab('stats'); }}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'stats' 
                  ? 'text-blue-700 bg-white/95 border border-white shadow-2xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BarChart2 size={14} className="text-slate-400" />
              <span>Statistics</span>
            </button>

            <button 
              onClick={() => { setActiveTab('settings'); }}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'settings' 
                  ? 'text-blue-700 bg-white/95 border border-white shadow-2xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Settings size={14} className="text-slate-400" />
              <span>Settings</span>
            </button>

            {/* Categories Section */}
            <div className="pt-3 border-t border-slate-200/60 mt-2">
              <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Filter size={11} className="text-slate-400" />
                  <span>Categories</span>
                </div>
                {selectedCategory !== 'all' && (
                  <button 
                    onClick={() => setSelectedCategory('all')} 
                    className="text-[10px] text-blue-600 hover:underline cursor-pointer lowercase"
                  >
                    reset
                  </button>
                )}
              </div>
              <div className="space-y-0.5 max-h-44 overflow-y-auto pr-0.5 custom-scroll">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-white/95 text-blue-700 font-bold shadow-2xs border border-white'
                      : 'text-slate-600 hover:bg-white/50'
                  }`}
                >
                  <span className="truncate">All Categories</span>
                  <span className="font-mono text-[10px] text-slate-400">{torrents.length}</span>
                </button>
                {availableCategories.map(cat => {
                  const count = categoryCounts[cat.toLowerCase()] || 0
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat.toLowerCase())}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                        selectedCategory === cat.toLowerCase()
                          ? 'bg-purple-50 text-purple-700 font-bold border border-purple-200/60 shadow-2xs'
                          : 'text-slate-600 hover:bg-white/50'
                      }`}
                    >
                      <span className="truncate capitalize">{cat}</span>
                      {count > 0 && (
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100/70 text-purple-700 font-bold">
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </nav>

          {/* Sidebar Status Footer */}
          <div className="px-2 text-[11px] text-slate-400 flex justify-between font-mono border-t border-slate-200/60 pt-3">
            <span>Daemon</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 127.0.0.1:8080
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div 
          onScroll={() => { if (menuAnchor) setMenuAnchor(null) }}
          className="flex-1 flex flex-col overflow-hidden bg-white/20 p-5 space-y-3 custom-scroll overflow-y-auto min-w-0"
        >
          
          {activeTab === 'search' ? (
            <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
              <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search for movies, software, music across indexers..."
                    className="w-full bg-white/70 border border-slate-200/80 rounded-full pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setSearchResults([]); setHasSearched(false); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button 
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-5 py-2.5 glass-btn-primary disabled:opacity-50 text-white font-medium rounded-full transition-colors text-xs flex items-center gap-2 cursor-pointer"
                >
                  {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  <span>Search</span>
                </button>
              </form>

              {searchError && (
                <div className="text-red-600 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-xs flex items-center justify-between">
                  <span>{searchError}</span>
                  <button onClick={() => setSearchError('')}><X size={14} /></button>
                </div>
              )}

              <div className="flex-1 overflow-auto space-y-2.5 custom-scroll">
                {filteredAndSortedSearchResults.map((res: any, idx) => {
                  const key = res.infoHash || `${res.name}-${idx}`
                  const existingTorrent = getExistingTorrent(res)
                  const isCopied = copiedMagnetHash === key
                  const isAdding = addingMagnetHash === key

                  return (
                    <div key={key} className="glass-row p-3.5 rounded-2xl flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{res.name}</h4>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                          <span>{formatBytes(res.size)}</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-semibold">Seeds: {res.seeders || 0}</span>
                          <span>•</span>
                          <span>Peers: {res.leechers || 0}</span>
                          {res.source && (
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px]">
                              {res.source}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyMagnet(res.magnet, key)}
                          className="glass-btn px-2.5 py-1 rounded-lg text-xs text-slate-600 font-medium"
                        >
                          {isCopied ? 'Copied' : 'Copy'}
                        </button>

                        {existingTorrent ? (
                          <button
                            onClick={() => {
                              setInspectorHash(existingTorrent.infoHash)
                              setActiveTab('downloading')
                            }}
                            className="glass-btn px-3 py-1 rounded-lg text-xs text-blue-600 font-bold"
                          >
                            View
                          </button>
                        ) : (
                          <button
                            disabled={isAdding}
                            onClick={() => handleDownloadFromSearch(res, key)}
                            className="glass-btn-primary px-3 py-1 rounded-lg text-xs font-bold"
                          >
                            {isAdding ? 'Adding...' : 'Download'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : activeTab === 'stats' ? (
            /* Complete Apple Frosted Glass Statistics Dashboard */
            <div className="max-w-4xl mx-auto w-full flex flex-col space-y-4 pr-1 pb-4">
              
              {/* Top Banner */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart2 size={16} className="text-blue-600" />
                    <span>Network & Swarm Telemetry</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Real-time aggregate bandwidth & BitTorrent swarm health</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Engine Stream
                  </span>
                </div>
              </div>

              {/* 6-Card Key Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="glass-card p-3.5 rounded-2xl border border-white bg-white/70 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Download Throughput</span>
                    <ArrowDown size={14} className="text-emerald-500" />
                  </div>
                  <div className="text-xl font-mono font-bold text-emerald-600 mt-2">
                    {formatBytes(latestDownSpeed)}/s
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    Peak: {formatBytes(peakDown)}/s
                  </div>
                </div>

                <div className="glass-card p-3.5 rounded-2xl border border-white bg-white/70 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Upload Throughput</span>
                    <ArrowUp size={14} className="text-blue-500" />
                  </div>
                  <div className="text-xl font-mono font-bold text-blue-600 mt-2">
                    {formatBytes(latestUpSpeed)}/s
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    Peak: {formatBytes(peakUp)}/s
                  </div>
                </div>

                <div className="glass-card p-3.5 rounded-2xl border border-white bg-white/70 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Global Share Ratio</span>
                    <TrendingUp size={14} className="text-indigo-500" />
                  </div>
                  <div className="text-xl font-mono font-bold text-indigo-600 mt-2">
                    {globalRatio.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    {globalRatio >= 1.0 ? '✓ Healthy Seeder' : 'Ratio Builder'}
                  </div>
                </div>

                <div className="glass-card p-3.5 rounded-2xl border border-white bg-white/70 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Total Downloaded</span>
                    <Database size={14} className="text-slate-400" />
                  </div>
                  <div className="text-lg font-mono font-bold text-slate-800 mt-2">
                    {formatBytes(totalDownloaded)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    Wanted: {formatBytes(totalWanted)}
                  </div>
                </div>

                <div className="glass-card p-3.5 rounded-2xl border border-white bg-white/70 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Total Uploaded</span>
                    <Zap size={14} className="text-slate-400" />
                  </div>
                  <div className="text-lg font-mono font-bold text-slate-800 mt-2">
                    {formatBytes(totalUploaded)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    All-time transferred
                  </div>
                </div>

                <div className="glass-card p-3.5 rounded-2xl border border-white bg-white/70 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Active Swarms</span>
                    <Globe size={14} className="text-slate-400" />
                  </div>
                  <div className="text-lg font-mono font-bold text-slate-800 mt-2">
                    {activeDownloadingSwarms + activeSeedingSwarms} <span className="text-xs text-slate-400 font-normal">/ {torrents.length}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    {activeDownloadingSwarms} DL • {activeSeedingSwarms} UL • {pausedSwarms} Idle
                  </div>
                </div>
              </div>

              {/* Dual-Curve Live Bandwidth History Chart (Last 60 Seconds) */}
              <div className="glass-card p-4 rounded-2xl border border-white bg-white/70 shadow-2xs flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Bandwidth History (Last 60s)</span>
                  
                  {/* Legend */}
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block"></span>
                      Download
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block"></span>
                      Upload
                    </span>
                  </div>
                </div>

                {/* SVG Graph Container */}
                <div className="relative w-full h-44 bg-slate-50/80 rounded-xl p-3 border border-slate-200/50 flex flex-col justify-between">
                  {(() => {
                    let maxSpeed = 1024 * 1024; // 1 MB/s floor
                    speedHistory.forEach(s => {
                      if (s.down > maxSpeed) maxSpeed = s.down;
                      if (s.up > maxSpeed) maxSpeed = s.up;
                    });
                    maxSpeed *= 1.15; // 15% headroom

                    const width = 100;
                    const height = 100;

                    const downPoints = speedHistory.map((s, i) => {
                      const x = (i / (Math.max(60, speedHistory.length) - 1)) * width;
                      const y = height - (s.down / maxSpeed) * height;
                      return `${x}%,${y}%`;
                    }).join(' ');

                    const upPoints = speedHistory.map((s, i) => {
                      const x = (i / (Math.max(60, speedHistory.length) - 1)) * width;
                      const y = height - (s.up / maxSpeed) * height;
                      return `${x}%,${y}%`;
                    }).join(' ');

                    const lastX = speedHistory.length > 0 ? ((speedHistory.length - 1) / (Math.max(60, speedHistory.length) - 1)) * width : 0;

                    return (
                      <>
                        <svg className="absolute inset-x-3 inset-y-3 w-[calc(100%-24px)] h-[calc(100%-24px)] overflow-visible" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="statDownGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                              <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                            </linearGradient>
                            <linearGradient id="statUpGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25"/>
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                            </linearGradient>
                          </defs>

                          {speedHistory.length >= 2 && (
                            <>
                              {/* Down Fill & Stroke */}
                              <polygon points={`0%,100% ${downPoints} ${lastX}%,100%`} fill="url(#statDownGrad)" />
                              <polyline points={downPoints} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

                              {/* Up Fill & Stroke */}
                              <polygon points={`0%,100% ${upPoints} ${lastX}%,100%`} fill="url(#statUpGrad)" />
                              <polyline points={upPoints} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                            </>
                          )}
                        </svg>

                        {/* Y-Axis Scale Indicators */}
                        <div className="absolute right-2 top-2 text-[9px] font-mono text-slate-400 pointer-events-none bg-white/70 px-1.5 py-0.5 rounded">
                          {formatBytes(maxSpeed)}/s
                        </div>
                        <div className="absolute right-2 top-[48%] text-[9px] font-mono text-slate-400 pointer-events-none bg-white/70 px-1.5 py-0.5 rounded">
                          {formatBytes(maxSpeed / 2)}/s
                        </div>
                        <div className="absolute right-2 bottom-2 text-[9px] font-mono text-slate-400 pointer-events-none bg-white/70 px-1.5 py-0.5 rounded">
                          0 B/s
                        </div>

                        {/* X-Axis Timeline Markers */}
                        <div className="absolute left-3 bottom-1 flex justify-between w-[calc(100%-80px)] text-[9px] font-mono text-slate-400 pointer-events-none">
                          <span>-60s</span>
                          <span>-45s</span>
                          <span>-30s</span>
                          <span>-15s</span>
                          <span>Now</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Swarm & Peer Health Card */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card p-3.5 rounded-2xl border border-white bg-white/70 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      👥
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Connected Swarm Peers</div>
                      <div className="text-[10px] text-slate-400">Total leechers contributing bandwidth</div>
                    </div>
                  </div>
                  <span className="text-lg font-mono font-bold text-blue-600">{totalPeers}</span>
                </div>

                <div className="glass-card p-3.5 rounded-2xl border border-white bg-white/70 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      🌱
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Verified Seeds Online</div>
                      <div className="text-[10px] text-slate-400">Complete file hosts across swarms</div>
                    </div>
                  </div>
                  <span className="text-lg font-mono font-bold text-emerald-600">{totalSeeds}</span>
                </div>
              </div>

              {/* Top Bandwidth Consuming Torrents Table */}
              <div className="glass-card p-4 rounded-2xl border border-white bg-white/70 shadow-2xs space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Active Swarm Traffic Distribution</span>
                  <span className="text-[10px] text-slate-400 font-mono">{torrents.length} registered transfers</span>
                </h4>

                {torrents.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No active transfers contributing to traffic</p>
                ) : (
                  <div className="space-y-1.5">
                    {torrents.slice(0, 5).map((t) => (
                      <div key={t.infoHash} className="p-2.5 rounded-xl bg-white/80 border border-slate-200/60 flex items-center justify-between text-xs">
                        <div className="truncate mr-3 flex-1 min-w-0">
                          <span className="font-bold text-slate-800 truncate block">{t.name || 'Fetching metadata...'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatBytes(t.downloaded)} of {formatBytes(t.length)} ({(t.progress * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className="flex items-center gap-4 font-mono text-[11px] shrink-0">
                          <span className="text-emerald-600 font-semibold">↓ {formatBytes(t.downloadSpeed)}/s</span>
                          <span className="text-blue-600">↑ {formatBytes(t.uploadSpeed)}/s</span>
                          <span className="text-slate-400 text-[10px]">Ratio: {t.ratio ? t.ratio.toFixed(2) : '0.00'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : activeTab === 'settings' ? (
            <div className="max-w-3xl mx-auto w-full">
              <SettingsComponent />
            </div>
          ) : displayedTorrents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 py-20">
              <div className="w-16 h-16 rounded-3xl bg-white/60 border border-white flex items-center justify-center text-2xl shadow-sm text-slate-400">
                ⚡
              </div>
              <p className="text-sm font-semibold text-slate-600">No transfers found</p>
              <p className="text-xs text-slate-400 max-w-xs text-center">
                Click + Add or drag and drop a .torrent or magnet link to begin streaming.
              </p>
            </div>
          ) : (
            displayedTorrents.map((t) => {
              const isInspectorOpen = inspectorHash === t.infoHash
              const isMenuAnchorActive = menuAnchor?.hash === t.infoHash
              return (
              <div 
                key={t.infoHash} 
                onClick={() => setInspectorHash(prev => prev === t.infoHash ? null : t.infoHash)}
                className={`glass-row rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-all ${
                  isInspectorOpen ? 'ring-2 ring-blue-500/40 bg-white/95' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  
                  {/* Torrent Title & Metrics */}
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-slate-900 truncate tracking-tight">
                        {t.name || 'Fetching metadata...'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        t.done 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' 
                          : t.paused 
                            ? 'bg-amber-50 text-amber-700 border-amber-200/80' 
                            : 'bg-blue-50 text-blue-700 border-blue-200/80'
                      }`}>
                        {t.done ? 'Seeding' : t.paused ? 'Paused' : 'Downloading'}
                      </span>
                      {t.category ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingCategoryTorrent({ hash: t.infoHash, currentCategory: t.category || '' })
                            setNewCategoryInput(t.category || '')
                          }}
                          className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-purple-50 text-purple-700 border-purple-200/80 hover:bg-purple-100 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Click to change category"
                        >
                          <span>📁 {t.category}</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingCategoryTorrent({ hash: t.infoHash, currentCategory: '' })
                            setNewCategoryInput('')
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded-full text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer border border-transparent hover:border-purple-200"
                          title="Assign category"
                        >
                          + Category
                        </button>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 font-mono flex items-center gap-3">
                      <span>{formatBytes(t.downloaded)} / {formatBytes(t.length)} ({(t.progress * 100).toFixed(1)}%)</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-emerald-600 font-semibold">↓ {formatBytes(t.downloadSpeed)}/s</span>
                      <span className="text-slate-300">•</span>
                      <span>{t.done ? 'Finished' : t.paused ? 'Paused' : t.state === 'downloading metadata' ? 'Fetching metadata...' : t.downloadSpeed === 0 ? 'ETA ∞' : `ETA ${formatTime(t.timeRemaining)}`}</span>
                      <span className="text-slate-300">•</span>
                      <span>Seeds: {t.numSeeds || 0} / Peers: {t.numPeers || 0}</span>
                    </div>
                  </div>

                  {/* Action Cluster: Play + Pause + 3-Dot Overflow */}
                  <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    
                    {/* Play in OmniPlayer Button */}
                    <button 
                      onClick={() => playInOmniPlayer(t.infoHash, undefined, t.name)}
                      className="glass-btn px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 shadow-2xs"
                      title="Stream instantly in embedded OmniPlayer"
                    >
                      <Play size={12} className="fill-current text-indigo-600" />
                      <span>Play</span>
                    </button>

                    {/* Pause / Resume Button */}
                    {t.paused ? (
                      <button 
                        onClick={() => window.torrentApi?.resumeTorrent(t.infoHash)}
                        className="glass-btn w-8 h-8 rounded-xl flex items-center justify-center text-xs text-emerald-600 hover:text-emerald-700"
                        title="Resume Transfer"
                      >
                        <Play size={12} className="fill-current" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => window.torrentApi?.pauseTorrent(t.infoHash)}
                        className="glass-btn w-8 h-8 rounded-xl flex items-center justify-center text-xs text-slate-600 hover:text-slate-900"
                        title="Pause Transfer"
                      >
                        <Pause size={12} className="fill-current" />
                      </button>
                    )}

                    {/* 3-Dot Base Menu Trigger */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        if (menuAnchor?.hash === t.infoHash) {
                          setMenuAnchor(null)
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setMenuAnchor({
                            hash: t.infoHash,
                            top: rect.bottom + 6,
                            right: window.innerWidth - rect.right,
                            bottom: window.innerHeight - rect.top + 6
                          })
                        }
                      }}
                      className={`glass-btn w-8 h-8 rounded-xl flex items-center justify-center text-xs transition ${
                        isMenuAnchorActive ? 'bg-slate-200/90 text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="More Options"
                    >
                      •••
                    </button>
                  </div>
                </div>

                {/* Slim Gradient Progress Bar */}
                <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden p-0.5 border border-white">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      t.done 
                        ? 'bg-emerald-500 shadow-xs' 
                        : t.paused 
                          ? 'bg-amber-400' 
                          : 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-xs animate-pulse'
                    }`}
                    style={{ width: `${Math.max(t.progress * 100, 2)}%` }}
                  />
                </div>
              </div>
            )})
          )}

        </div>

        {/* Collapsible Right-Hand Side Panel (Inspector Drawer) */}
        {currentInspectorTorrent && (
          <div className="w-84 glass-sidepanel flex flex-col justify-between p-4 z-20 animate-fade-in-up">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                <div className="flex items-center gap-2">
                  <Layers size={15} className="text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">Side Inspector</span>
                </div>
                <button 
                  onClick={() => setInspectorHash(null)}
                  className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-800 text-xs"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Meta Card */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 truncate" title={currentInspectorTorrent.name}>
                  {currentInspectorTorrent.name}
                </h4>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {formatBytes(currentInspectorTorrent.downloaded)} of {formatBytes(currentInspectorTorrent.length)} ({(currentInspectorTorrent.progress > 1 ? currentInspectorTorrent.progress : currentInspectorTorrent.progress * 100).toFixed(1)}%)
                </div>
              </div>

              {/* Sidepanel Tabs */}
              <div className="flex gap-1 border-b border-slate-200/70 pb-2 text-xs font-semibold text-slate-500">
                <button 
                  onClick={() => setInspectorTab('files')}
                  className={`pb-1 px-1 transition-colors ${inspectorTab === 'files' ? 'text-blue-600 border-b-2 border-blue-600 font-bold' : 'hover:text-slate-800'}`}
                >
                  Files ({currentInspectorTorrent.files?.length || 0})
                </button>
                <button 
                  onClick={() => setInspectorTab('peers')}
                  className={`pb-1 px-1 transition-colors ${inspectorTab === 'peers' ? 'text-blue-600 border-b-2 border-blue-600 font-bold' : 'hover:text-slate-800'}`}
                >
                  Peers ({currentInspectorTorrent.numPeers || 0})
                </button>
                <button 
                  onClick={() => setInspectorTab('trackers')}
                  className={`pb-1 px-1 transition-colors ${inspectorTab === 'trackers' ? 'text-blue-600 border-b-2 border-blue-600 font-bold' : 'hover:text-slate-800'}`}
                >
                  Trackers
                </button>
                <button 
                  onClick={() => setInspectorTab('pieces')}
                  className={`pb-1 px-1 transition-colors ${inspectorTab === 'pieces' ? 'text-blue-600 border-b-2 border-blue-600 font-bold' : 'hover:text-slate-800'}`}
                >
                  Pieces
                </button>
                <button 
                  onClick={() => setInspectorTab('ai')}
                  className={`pb-1 px-1 transition-colors flex items-center gap-1 ${inspectorTab === 'ai' ? 'text-purple-600 border-b-2 border-purple-600 font-bold' : 'hover:text-slate-800'}`}
                >
                  <Sparkles size={12} className={inspectorTab === 'ai' ? 'text-purple-600' : 'text-slate-400'} />
                  AI Media
                </button>
              </div>

              {/* Tab: Files */}
              {inspectorTab === 'files' && (
                <div className="space-y-2 text-xs max-h-72 overflow-y-auto custom-scroll pr-1">
                  {currentInspectorTorrent.files?.some(f => f.securityStatus === 'infected') && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center gap-2">
                      <ShieldX className="text-rose-600 shrink-0" size={16} />
                      <span>Security Warning: Known malware detected in this torrent!</span>
                    </div>
                  )}
                  {currentInspectorTorrent.files?.some(f => (f.isRiskyType || f.isDoubleExtension) && f.securityStatus !== 'infected') && (
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                      <ShieldAlert className="text-amber-600 shrink-0" size={14} />
                      <span>Executable files detected. Execution guard active.</span>
                    </div>
                  )}

                  {currentInspectorTorrent.files && currentInspectorTorrent.files.length > 0 ? (
                    currentInspectorTorrent.files.map((file, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex flex-col gap-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="truncate mr-2 flex-1">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold text-slate-800 truncate" title={file.name}>
                                {file.name}
                              </span>
                              {/* Security Status Badge */}
                              {file.securityStatus === 'infected' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0" title={file.threatName || 'Malware detected'}>
                                  <ShieldX size={10} /> {file.threatName || 'Infected'}
                                </span>
                              ) : file.isDoubleExtension ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0" title="Deceptive double extension">
                                  <ShieldAlert size={10} /> Double Ext
                                </span>
                              ) : file.isRiskyType ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0" title="Executable file">
                                  <ShieldAlert size={10} /> Executable
                                </span>
                              ) : file.securityStatus === 'scanning' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                  <Loader2 size={10} className="animate-spin" /> Scanning
                                </span>
                              ) : file.securityStatus === 'clean' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0" title={file.securityDetails || 'Safe'}>
                                  <ShieldCheck size={10} /> Clean
                                </span>
                              ) : null}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {formatBytes(file.length)} • {(file.progress * 100).toFixed(0)}%
                              {file.sha256 && (
                                <span className="ml-2 text-[9px] text-slate-400 font-mono" title={file.sha256}>
                                  SHA: {file.sha256.substring(0, 8)}...
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button 
                              onClick={() => handleScanFile(currentInspectorTorrent.infoHash, i)}
                              title="Scan file for threats"
                              className="glass-btn px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1"
                            >
                              <Shield size={10} /> Scan
                            </button>
                            <button 
                              onClick={() => playInOmniPlayer(currentInspectorTorrent.infoHash, i, file.name, { status: file.securityStatus, threatName: file.threatName, isRisky: file.isRiskyType })}
                              className="glass-btn px-2.5 py-1 rounded-lg text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                              <Play size={10} className="fill-current" /> Stream
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 pt-1 border-t border-slate-100">
                          <span className="text-slate-400 mr-1">Priority:</span>
                          <button
                            onClick={() => handleSetPriority(currentInspectorTorrent.infoHash, i, 7)}
                            className="px-2 py-0.5 rounded-md hover:bg-blue-50 text-blue-600 hover:text-blue-700 border border-slate-200"
                          >
                            High
                          </button>
                          <button
                            onClick={() => handleSetPriority(currentInspectorTorrent.infoHash, i, 4)}
                            className="px-2 py-0.5 rounded-md hover:bg-slate-50 text-slate-600 hover:text-slate-800 border border-slate-200"
                          >
                            Normal
                          </button>
                          <button
                            onClick={() => handleSetPriority(currentInspectorTorrent.infoHash, i, 0)}
                            className="px-2 py-0.5 rounded-md hover:bg-red-50 text-red-500 hover:text-red-700 border border-slate-200"
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 py-6 text-center">No file details yet</div>
                  )}
                </div>
              )}

              {/* Tab: Peers */}
              {inspectorTab === 'peers' && (
                <div className="space-y-2 text-[11px] max-h-72 overflow-y-auto custom-scroll">
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div className="p-2 bg-white rounded-lg border border-slate-200/60 flex justify-between">
                      <span className="text-slate-600">Peers</span>
                      <span className="text-blue-600 font-bold">{currentInspectorTorrent.numPeers || peerList.length}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200/60 flex justify-between">
                      <span className="text-slate-600">Seeds</span>
                      <span className="text-emerald-600 font-bold">{currentInspectorTorrent.numSeeds || 0}</span>
                    </div>
                  </div>

                  {peerList.length > 0 ? (
                    <div className="space-y-1 font-mono">
                      {peerList.map((p, idx) => (
                        <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200/60 flex flex-col gap-1 text-[10px]">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 truncate mr-2">{p.ip}</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">{p.source || 'Peer'}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-500">
                            <span className="truncate max-w-[120px]">{p.client}</span>
                            <span className="text-blue-600 font-semibold">{(p.progress * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5 border-t border-slate-100">
                            <span>↓ {formatBytes(p.down_speed || 0)}/s • ↑ {formatBytes(p.up_speed || 0)}/s</span>
                            {p.flags && <span className="text-slate-400 truncate max-w-[110px]">{p.flags}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400 italic text-center py-6 text-xs">Waiting for swarm handshakes...</div>
                  )}
                </div>
              )}

              {/* Tab: Trackers */}
              {inspectorTab === 'trackers' && (
                <div className="space-y-2 text-[10px] font-mono max-h-72 overflow-y-auto custom-scroll">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-700">Trackers ({trackerList.length || currentInspectorTorrent.announce?.length || 0})</span>
                    <button
                      onClick={() => handleReannounce(currentInspectorTorrent.infoHash)}
                      className="glass-btn px-2 py-0.5 rounded text-[10px] font-bold text-blue-600 hover:text-blue-700"
                    >
                      Reannounce
                    </button>
                  </div>

                  {/* Add Tracker Form */}
                  <form onSubmit={(e) => handleAddTracker(e, currentInspectorTorrent.infoHash)} className="flex gap-1.5">
                    <input
                      type="text"
                      value={newTrackerUrl}
                      onChange={(e) => setNewTrackerUrl(e.target.value)}
                      placeholder="udp://tracker.opentrackr.org:1337/announce"
                      className="flex-1 px-2 py-1 bg-white rounded-lg border border-slate-200 text-[10px] focus:outline-none focus:border-blue-400"
                    />
                    <button
                      type="submit"
                      disabled={isAddingTracker || !newTrackerUrl.trim()}
                      className="glass-btn-primary px-2.5 py-1 rounded-lg text-[10px] font-bold disabled:opacity-50 shrink-0"
                    >
                      Add
                    </button>
                  </form>

                  {trackerList.length > 0 ? (
                    trackerList.map((tr, i) => (
                      <div key={i} className="p-2 bg-white rounded-lg border border-slate-200/60 flex flex-col gap-0.5">
                        <div className="break-all font-semibold text-slate-800">{tr.url}</div>
                        <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5">
                          <span className={tr.status?.toLowerCase().includes('working') ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                            {tr.status}
                          </span>
                          <span>Seeds: {tr.seeds || 0} • Peers: {tr.peers || 0}</span>
                        </div>
                        {tr.message && <div className="text-[9px] text-amber-600 italic truncate">{tr.message}</div>}
                      </div>
                    ))
                  ) : currentInspectorTorrent.announce && currentInspectorTorrent.announce.length > 0 ? (
                    currentInspectorTorrent.announce.map((url, i) => (
                      <div key={i} className="p-2 bg-white rounded-lg border border-slate-200/60 break-all text-slate-700">
                        {url}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 italic text-center py-4">DHT / PEX Swarm Only</div>
                  )}
                </div>
              )}

              {/* Tab: Pieces */}
              {inspectorTab === 'pieces' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Swarm Piece Bitfield:</span>
                    <span>
                      {pieceInfo?.num_pieces ? `${pieceInfo.num_pieces} Pieces (${formatBytes(pieceInfo.piece_length || 0)}/ea)` : 'Verifying...'}
                    </span>
                  </div>

                  {pieceInfo?.bitfield ? (
                    <div className="p-2.5 bg-slate-100/90 rounded-xl border border-slate-200 max-h-48 overflow-y-auto custom-scroll">
                      <div className="flex flex-wrap gap-0.5">
                        {pieceInfo.bitfield.slice(0, 300).split('').map((bit, idx) => {
                          const isDone = bit === '1';
                          const avail = pieceInfo.availability?.[idx] || 0;
                          return (
                            <div
                              key={idx}
                              title={`Piece #${idx} - ${isDone ? 'Verified' : 'Missing'} (Swarm Avail: ${avail})`}
                              className={`w-2.5 h-2.5 rounded-2xs cursor-pointer transition-all hover:scale-125 ${
                                isDone 
                                  ? 'bg-blue-600 shadow-2xs' 
                                  : avail > 0 
                                    ? 'bg-slate-300 hover:bg-slate-400' 
                                    : 'bg-slate-200'
                              }`}
                            />
                          );
                        })}
                      </div>
                      {pieceInfo.num_pieces > 300 && (
                        <div className="text-[9px] font-mono text-slate-400 text-center mt-2">
                          Showing first 300 of {pieceInfo.num_pieces} pieces
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-2 bg-slate-100/90 rounded-xl border border-slate-200 flex flex-wrap gap-0.5 max-h-36 overflow-hidden">
                      {Array.from({ length: 48 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-2 h-2 rounded-2xs ${
                            i / 48 <= (currentInspectorTorrent.progress > 1 ? currentInspectorTorrent.progress / 100 : currentInspectorTorrent.progress) 
                              ? 'bg-blue-500' 
                              : 'bg-slate-300'
                          }`} 
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 justify-end pt-1">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-2xs bg-blue-600"></span> Verified</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-2xs bg-slate-300"></span> In Swarm</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-2xs bg-slate-200"></span> Missing</span>
                  </div>
                </div>
              )}

              {/* Tab: Local AI Media Intelligence */}
              {inspectorTab === 'ai' && (
                <div className="space-y-3 text-xs max-h-72 overflow-y-auto custom-scroll pr-1">
                  {loadingAI ? (
                    <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                      <Loader2 size={22} className="animate-spin text-purple-600" />
                      <span>Analyzing metadata with Local AI...</span>
                    </div>
                  ) : mediaAIData?.torrent_metadata ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200/70 rounded-2xl flex flex-col gap-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={12} /> Local AI Media Parser
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                            {mediaAIData.torrent_metadata.media_type}
                          </span>
                        </div>

                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            {mediaAIData.torrent_metadata.clean_title}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {mediaAIData.torrent_metadata.season > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                                S{mediaAIData.torrent_metadata.season < 10 ? `0${mediaAIData.torrent_metadata.season}` : mediaAIData.torrent_metadata.season}
                                E{mediaAIData.torrent_metadata.episode < 10 ? `0${mediaAIData.torrent_metadata.episode}` : mediaAIData.torrent_metadata.episode}
                              </span>
                            )}
                            {mediaAIData.torrent_metadata.year > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                                {mediaAIData.torrent_metadata.year}
                              </span>
                            )}
                            {mediaAIData.torrent_metadata.resolution && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                {mediaAIData.torrent_metadata.resolution}
                              </span>
                            )}
                            {mediaAIData.torrent_metadata.source && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-medium">
                                {mediaAIData.torrent_metadata.source}
                              </span>
                            )}
                            {mediaAIData.torrent_metadata.video_codec && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-medium">
                                {mediaAIData.torrent_metadata.video_codec}
                              </span>
                            )}
                            {mediaAIData.torrent_metadata.audio_format && (
                              <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 text-[10px] font-medium">
                                {mediaAIData.torrent_metadata.audio_format}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Suggested Standard Filename */}
                        <div className="mt-1 pt-2 border-t border-purple-200/50">
                          <div className="text-[10px] text-slate-500 font-medium mb-1">Standardized Clean Filename (Plex / Jellyfin):</div>
                          <div className="flex items-center justify-between gap-2 p-2 bg-white/80 rounded-xl border border-purple-200/80 font-mono text-[11px] text-slate-800 break-all">
                            <span>{mediaAIData.torrent_metadata.suggested_filename}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(mediaAIData.torrent_metadata.suggested_filename)
                                setCopiedAIFilename(true)
                                setTimeout(() => setCopiedAIFilename(false), 2000)
                              }}
                              className="p-1 rounded-lg hover:bg-purple-100 text-purple-700 shrink-0 transition-colors"
                              title="Copy Clean Name"
                            >
                              {copiedAIFilename ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Files breakdown if multiple */}
                      {mediaAIData.files && mediaAIData.files.length > 1 && (
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-semibold text-slate-600">Parsed Files ({mediaAIData.files.length}):</div>
                          {mediaAIData.files.map((f: any, idx: number) => (
                            <div key={idx} className="p-2 bg-white rounded-xl border border-slate-200/80 flex flex-col gap-1">
                              <div className="text-slate-500 truncate text-[10px]">{f.original_name}</div>
                              <div className="font-medium text-slate-800 text-[11px] text-purple-900 font-mono truncate">
                                → {f.metadata.suggested_filename}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400">
                      No media intelligence metadata found for this torrent.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Quick Stream Button */}
            <button 
              onClick={() => playInOmniPlayer(currentInspectorTorrent.infoHash, undefined, currentInspectorTorrent.name)}
              className="w-full glass-btn-primary font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm mt-4"
            >
              <Play size={13} className="fill-current" />
              <span>Stream in OmniPlayer</span>
            </button>
          </div>
        )}

      </div>

      {/* Add Torrent Modal Sheet */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in-up">
          <div className="w-full max-w-lg glass-window p-6 rounded-3xl space-y-4 shadow-2xl border border-white bg-white/95">
            <div className="flex justify-between items-center border-b border-slate-200/70 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Torrent / Magnet Link</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-800"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleAddTorrent} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Paste Magnet URI, Info Hash, or .torrent URL</label>
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={magnetLink}
                    onChange={(e) => setMagnetLink(e.target.value)}
                    placeholder="magnet:?xt=urn:btih:... or info hash or https://..."
                    className="w-full p-2.5 pr-20 rounded-xl bg-white border border-slate-300 focus:outline-none focus:border-blue-500 font-mono text-[11px] shadow-2xs"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        let text = ''
                        if (window.torrentApi?.readClipboard) {
                          text = await window.torrentApi.readClipboard()
                        } else if (navigator.clipboard) {
                          text = await navigator.clipboard.readText()
                        }
                        if (text) {
                          const sanitized = sanitizeMagnetInput(text)
                          setMagnetLink(sanitized)
                          setError('')
                        }
                      } catch (err) {
                        console.error('Failed to paste from clipboard:', err)
                      }
                    }}
                    className="absolute right-2 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold border border-slate-300 transition-colors flex items-center gap-1"
                    title="Paste from clipboard"
                  >
                    <Copy size={11} />
                    <span>Paste</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Save Location</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={customSavePath}
                    onChange={(e) => setCustomSavePath(e.target.value)}
                    placeholder="~/Downloads"
                    className="flex-1 p-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px]"
                  />
                  <button 
                    type="button"
                    onClick={async () => {
                      const folder = await window.torrentApi?.selectFolder();
                      if (folder) setCustomSavePath(folder);
                    }}
                    className="glass-btn px-3 py-1.5 rounded-xl text-xs font-semibold"
                  >
                    Browse...
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Category (Optional)</label>
                <input 
                  type="text" 
                  value={addCategory}
                  onChange={(e) => setAddCategory(e.target.value)}
                  placeholder="e.g. movies, tv, sonarr, radarr"
                  className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px]"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['movies', 'tv', 'music', 'sonarr', 'radarr'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAddCategory(preset)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition cursor-pointer border ${
                        addCategory.toLowerCase() === preset
                          ? 'bg-purple-100 text-purple-700 border-purple-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-purple-50'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                  {addCategory && (
                    <button
                      type="button"
                      onClick={() => setAddCategory('')}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-medium transition cursor-pointer text-red-600 hover:bg-red-50 border border-red-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Browse .torrent file */}
              <div 
                onClick={async () => {
                  if (window.torrentApi) {
                    const path = await window.torrentApi.openTorrentDialog()
                    if (path) {
                      try {
                        if (path !== 'torrent-added-via-file') await window.torrentApi.addTorrent(path, customSavePath || undefined)
                        setShowAddModal(false)
                      } catch (err: any) {
                        setError(err.message || String(err))
                      }
                    }
                  }
                }}
                className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-4 text-center bg-slate-50/60 cursor-pointer transition"
              >
                <span className="text-xl block mb-1">📂</span>
                <span className="text-slate-700 font-semibold">Choose .torrent file from Mac</span>
                <span className="text-slate-400 block text-[10px] mt-0.5">or drag & drop files anywhere in window</span>
              </div>

              {error && <p className="text-red-600 text-xs">{error}</p>}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/70">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="glass-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!magnetLink.trim()}
                  className="glass-btn-primary px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  Start Download
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Editor Modal Sheet */}
      {editingCategoryTorrent && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in-up">
          <div className="w-full max-w-sm glass-window p-5 rounded-3xl space-y-4 shadow-2xl border border-white bg-white/95 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200/70 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>📁</span>
                <span>Set Category</span>
              </h3>
              <button 
                onClick={() => setEditingCategoryTorrent(null)}
                className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-800"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-slate-600 font-semibold">Category Name</label>
              <input 
                type="text"
                value={newCategoryInput}
                onChange={e => setNewCategoryInput(e.target.value)}
                placeholder="e.g. movies, tv, sonarr, radarr"
                className="w-full p-2.5 rounded-xl bg-white border border-slate-300 focus:outline-none focus:border-purple-500 font-mono text-xs shadow-2xs"
                autoFocus
              />
              
              <div className="pt-1">
                <span className="text-[10px] text-slate-400 block mb-1">Quick Select:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['movies', 'tv', 'music', 'sonarr', 'radarr'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewCategoryInput(preset)}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 text-[11px] font-medium transition cursor-pointer border border-slate-200/60"
                    >
                      {preset}
                    </button>
                  ))}
                  {editingCategoryTorrent.currentCategory && (
                    <button
                      type="button"
                      onClick={() => setNewCategoryInput('')}
                      className="px-2 py-0.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-medium transition cursor-pointer border border-red-200/60"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/70">
              <button
                type="button"
                onClick={() => setEditingCategoryTorrent(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveCategory(editingCategoryTorrent.hash, newCategoryInput.trim())}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clipboard Magnet Toast */}
      {clipboardMagnet && (
        <div className="fixed bottom-6 right-6 glass-window bg-white/95 rounded-2xl p-4 shadow-2xl flex items-start space-x-3.5 max-w-sm z-50 border border-white">
          <div className="text-2xl mt-0.5">🧲</div>
          <div className="flex-1 min-w-0">
            <h4 className="text-slate-900 font-bold text-xs">Magnet link detected</h4>
            <p className="text-slate-500 text-[11px] truncate w-56 my-1" title={clipboardMagnet}>{clipboardMagnet}</p>
            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => {
                  setMagnetLink(clipboardMagnet)
                  setShowAddModal(true)
                  setClipboardMagnet(null)
                }}
                className="glass-btn-primary px-3 py-1 rounded-lg text-xs font-bold"
              >
                Add Torrent
              </button>
              <button 
                onClick={() => setClipboardMagnet(null)}
                className="glass-btn px-3 py-1 rounded-lg text-xs font-semibold text-slate-600"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execution Guard Security Modal */}
      {securityModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="glass-card bg-white p-6 rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${securityModal.isMalware ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                {securityModal.isMalware ? <ShieldX size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900">{securityModal.title}</h3>
                <p className="text-xs text-slate-500 font-mono truncate" title={securityModal.fileName}>
                  {securityModal.fileName}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {securityModal.details}
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSecurityModal(null)}
                className="glass-btn px-4 py-2 rounded-xl font-bold text-xs text-slate-700 hover:text-slate-900"
              >
                Cancel (Safe)
              </button>
              <button
                onClick={securityModal.onConfirm}
                className={`px-4 py-2 rounded-xl font-bold text-xs text-white shadow-sm transition-colors ${
                  securityModal.isMalware 
                    ? 'bg-rose-600 hover:bg-rose-700' 
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Video Player Overlay */}
      {playerModal && (
        <VideoPlayer 
          streamUrl={playerModal.streamUrl} 
          title={playerModal.title}
          infoHash={playerModal.infoHash}
          fileIndex={playerModal.fileIndex}
          onClose={() => setPlayerModal(null)} 
        />
      )}

      {/* Floating 3-Dot Action Menu (Rendered via React Portal at Root) */}
      {menuAnchor && (() => {
        const activeTorrent = torrents.find(t => t.infoHash === menuAnchor.hash)
        if (!activeTorrent) return null
        const openUpward = menuAnchor.top > window.innerHeight - 230

        return createPortal(
          <>
            {/* Transparent backdrop for outside click dismiss */}
            <div 
              className="fixed inset-0 z-[9998] bg-transparent" 
              onClick={(e) => {
                e.stopPropagation()
                setMenuAnchor(null)
              }}
            />

            {/* Floating Menu Popover */}
            <div 
              className="fixed w-52 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-2xl shadow-2xl p-1.5 z-[9999] text-xs text-slate-700 space-y-0.5 animate-fade-in-up"
              style={{
                right: `${Math.max(12, menuAnchor.right)}px`,
                top: openUpward ? undefined : `${menuAnchor.top}px`,
                bottom: openUpward ? `${menuAnchor.bottom}px` : undefined,
              }}
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => { 
                  setInspectorHash(activeTorrent.infoHash); 
                  setMenuAnchor(null); 
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 text-blue-600 flex items-center gap-2.5 font-semibold transition-colors"
              >
                <Layers size={14} className="text-blue-500" />
                <span>Open Side Inspector</span>
              </button>

              <button 
                onClick={() => { 
                  handleStop(activeTorrent.infoHash); 
                  setMenuAnchor(null); 
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center gap-2.5 font-medium transition-colors"
              >
                <Square size={14} className="text-slate-500" />
                <span>Stop Torrent</span>
              </button>

              {activeTorrent.path && (
                <button 
                  onClick={() => {
                    fetch((window.location.port === '5173' ? 'http://localhost:8080' : '') + '/api/torrents/' + activeTorrent.infoHash + '/open_folder', { method: 'POST' })
                    setMenuAnchor(null);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center gap-2.5 font-medium transition-colors"
                >
                  <FolderOpen size={14} className="text-slate-500" />
                  <span>Show in Finder</span>
                </button>
              )}

              {activeTorrent.magnetURI && (
                <button 
                  onClick={() => {
                    window.torrentApi?.copyToClipboard(activeTorrent.magnetURI!);
                    setMenuAnchor(null);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center gap-2.5 font-medium transition-colors"
                >
                  <Copy size={14} className="text-slate-500" />
                  <span>Copy Magnet</span>
                </button>
              )}

              <button 
                onClick={() => { 
                  setEditingCategoryTorrent({ hash: activeTorrent.infoHash, currentCategory: activeTorrent.category || '' });
                  setNewCategoryInput(activeTorrent.category || '');
                  setMenuAnchor(null); 
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-purple-50 text-purple-700 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
              >
                <Filter size={14} className="text-purple-500" />
                <span>{activeTorrent.category ? `Category: ${activeTorrent.category}` : 'Set Category...'}</span>
              </button>

              <div className="h-px bg-slate-200/60 my-1"></div>

              <button 
                onClick={() => { 
                  handleRemove(activeTorrent.infoHash, activeTorrent.name); 
                  setMenuAnchor(null); 
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 flex items-center gap-2.5 font-semibold transition-colors"
              >
                <Trash2 size={14} className="text-red-500" />
                <span>Delete Torrent</span>
              </button>
            </div>
          </>,
          document.body
        )
      })()}

    </div>
  )
}

export default App
