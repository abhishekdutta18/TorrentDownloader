import { X, ExternalLink, Play, AlertCircle, Captions, Search, Download, Check, Loader2, Globe, Cpu, Sparkles, Key } from 'lucide-react'
import { useEffect, useRef, useCallback, useState } from 'react'

interface VideoPlayerProps {
  streamUrl: string
  title?: string
  infoHash?: string
  fileIndex?: number
  onClose: () => void
}

interface SubtitleTrack {
  id: string
  label: string
  language: string
  path: string
}

interface OnlineSubtitleItem {
  id: string
  language: string
  release_name: string
  download_url: string
  is_hash_match: boolean
  download_count: number
}

const getStoredGroqKey = (): string => {
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
      return window.localStorage.getItem('omni_groq_key') || ''
    }
  } catch {}
  return ''
}

const setStoredGroqKey = (val: string) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (val && typeof window.localStorage.setItem === 'function') {
        window.localStorage.setItem('omni_groq_key', val)
      } else if (!val && typeof window.localStorage.removeItem === 'function') {
        window.localStorage.removeItem('omni_groq_key')
      }
    }
  } catch {}
}

export function VideoPlayer({ streamUrl, title, infoHash, fileIndex, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasError, setHasError] = useState(false)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [isTranscoding, setIsTranscoding] = useState(false)
  const [transcoderAvailable, setTranscoderAvailable] = useState<boolean | null>(null)

  // Subtitle States
  const [activeTrack, setActiveTrack] = useState<SubtitleTrack | null>(null)
  const [localTracks, setLocalTracks] = useState<SubtitleTrack[]>([])
  const [showSubMenu, setShowSubMenu] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [onlineResults, setOnlineResults] = useState<OnlineSubtitleItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [searchLang, setSearchLang] = useState('en')
  const [movieHash, setMovieHash] = useState<string>('')

  // AI Subtitle States
  const [groqApiKey, setGroqApiKey] = useState<string>(() => getStoredGroqKey())
  const [isAITranscribing, setIsAITranscribing] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiSuccess, setAiSuccess] = useState<string | null>(null)
  const [activeModalTab, setActiveModalTab] = useState<'opensubtitles' | 'ai'>('opensubtitles')

  const apiBase = (window.location.port === '5173' || window.location.port === '3000') ? 'http://localhost:8080' : ''
  const effectiveStreamUrl = isTranscoding && infoHash !== undefined && fileIndex !== undefined
    ? `${apiBase}/api/stream/${infoHash}/${fileIndex}/transcode`
    : streamUrl

  const handleClose = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.removeAttribute('src')
      videoRef.current.load()
    }
    onClose()
  }, [onClose])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSearchModal) {
          setShowSearchModal(false)
        } else {
          handleClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose, showSearchModal])

  // Load Subtitles on mount
  useEffect(() => {
    if (infoHash === undefined || fileIndex === undefined) return

    const loadSubtitles = async () => {
      try {
        const res = await fetch(`${apiBase}/api/torrents/${infoHash}/files/${fileIndex}/subtitles?lang=${searchLang}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.status === 'success') {
          if (data.movie_hash) setMovieHash(data.movie_hash)
          
          const locals: SubtitleTrack[] = (data.local_subtitles || []).map((s: any, idx: number) => ({
            id: s.id || `local-${idx}`,
            label: `${(s.language || 'en').toUpperCase()} - ${s.release_name || 'Local'}`,
            language: s.language || 'en',
            path: s.local_path
          }))
          setLocalTracks(locals)

          // Auto-select first English or local subtitle if present
          if (locals.length > 0) {
            const enSub = locals.find(l => l.language.toLowerCase() === 'en') || locals[0]
            setActiveTrack(curr => curr || enSub)
          }

          if (data.online_subtitles) {
            setOnlineResults(data.online_subtitles)
          }
        }
      } catch (err) {
        console.warn('Failed to discover subtitles:', err)
      }
    }

    loadSubtitles()
  }, [infoHash, fileIndex, apiBase, searchLang])

  // Check Transcoder Engine status
  useEffect(() => {
    fetch(`${apiBase}/api/transcoder/status`)
      .then(res => res.json())
      .then(data => {
        setTranscoderAvailable(!!data.available)
      })
      .catch(() => setTranscoderAvailable(false))
  }, [apiBase])

  const handleToggleTranscode = () => {
    setHasError(false)
    setErrorDetails(null)
    setIsTranscoding(prev => !prev)
  }

  // Configure text track when active track changes
  useEffect(() => {
    if (!videoRef.current) return
    const video = videoRef.current
    const timer = setTimeout(() => {
      if (video.textTracks && video.textTracks.length > 0) {
        for (let i = 0; i < video.textTracks.length; i++) {
          video.textTracks[i].mode = activeTrack ? 'showing' : 'disabled'
        }
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [activeTrack])

  const handleOpenInSystemPlayer = async () => {
    if (infoHash !== undefined && fileIndex !== undefined) {
      try {
        await fetch(`${apiBase}/api/torrents/${infoHash}/files/${fileIndex}/play`, { method: 'POST' })
      } catch (e) {
        console.warn('Failed to open system player:', e)
      }
    }
  }

  const handleSearchOnline = async () => {
    if (infoHash === undefined || fileIndex === undefined) return
    setIsSearching(true)
    try {
      const res = await fetch(`${apiBase}/api/torrents/${infoHash}/files/${fileIndex}/subtitles?lang=${searchLang}`)
      if (res.ok) {
        const data = await res.json()
        if (data.online_subtitles) {
          setOnlineResults(data.online_subtitles)
        }
      }
    } catch (e) {
      console.warn('Failed online subtitle query:', e)
    } finally {
      setIsSearching(false)
    }
  }

  const handleDownloadSubtitle = async (item: OnlineSubtitleItem) => {
    if (infoHash === undefined || fileIndex === undefined) return
    setIsDownloading(true)
    try {
      const res = await fetch(`${apiBase}/api/torrents/${infoHash}/files/${fileIndex}/subtitles/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          download_url: item.download_url,
          language: item.language
        })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.saved_path) {
          const newTrack: SubtitleTrack = {
            id: item.id,
            label: `${item.language.toUpperCase()} (Downloaded)`,
            language: item.language,
            path: data.saved_path
          }
          setLocalTracks(prev => [newTrack, ...prev])
          setActiveTrack(newTrack)
          setShowSearchModal(false)
        }
      }
    } catch (e) {
      console.warn('Failed to download subtitle:', e)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleAITranscribe = async () => {
    const trimmedKey = groqApiKey.trim()
    if (!trimmedKey) {
      setAiError('Please enter your Groq API Key (get one free at console.groq.com)')
      return
    }
    if (infoHash === undefined || fileIndex === undefined) return

    setIsAITranscribing(true)
    setAiError(null)
    setAiSuccess(null)

    try {
      setStoredGroqKey(trimmedKey)
      const res = await fetch(`${apiBase}/api/torrents/${infoHash}/files/${fileIndex}/subtitles/ai_transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groq_api_key: trimmedKey,
          language: searchLang
        })
      })

      const data = await res.json()
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'AI transcription failed')
      }

      const newTrack: SubtitleTrack = {
        id: `ai-${Date.now()}`,
        label: `✨ AI (${(data.language || searchLang).toUpperCase()} Groq Whisper)`,
        language: data.language || searchLang,
        path: data.saved_path
      }

      setLocalTracks(prev => [newTrack, ...prev.filter(t => t.path !== data.saved_path)])
      setActiveTrack(newTrack)
      setAiSuccess('✨ AI Subtitles created and applied successfully!')
      setTimeout(() => {
        setShowSearchModal(false)
        setAiSuccess(null)
      }, 1500)
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate AI subtitles')
    } finally {
      setIsAITranscribing(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6 animate-fade-in-up"
      role="dialog"
      aria-modal="true"
      aria-label="OmniFlux Video Stream"
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-5xl bg-white/95 rounded-3xl overflow-hidden shadow-2xl border border-white/80 backdrop-blur-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modern Light Frosted Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50/80 backdrop-blur-md border-b border-slate-100 text-slate-800 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold truncate text-slate-700 tracking-tight">
              {title || 'Live Swarm Video Stream'}
            </span>
            {activeTrack && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold border border-blue-200">
                CC: {activeTrack.language.toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Transcoding Engine Toggle */}
            {infoHash !== undefined && fileIndex !== undefined && (
              <button
                onClick={handleToggleTranscode}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isTranscoding 
                    ? 'bg-amber-500 text-white shadow-xs' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title={
                  transcoderAvailable === false
                    ? 'FFmpeg is not detected on host system. Direct playback used.'
                    : isTranscoding
                      ? 'Streaming via real-time FFmpeg MP4 Transcoder'
                      : 'Switch to FFmpeg on-the-fly Transcoding'
                }
              >
                <Cpu size={13} />
                <span>{isTranscoding ? 'Transcoding' : 'Direct Play'}</span>
              </button>
            )}

            {/* Subtitles Button & Popover */}
            <div className="relative">
              <button
                onClick={() => setShowSubMenu(!showSubMenu)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTrack 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="Subtitles & Closed Captions"
              >
                <Captions size={13} />
                <span>{activeTrack ? activeTrack.language.toUpperCase() : 'Subtitles'}</span>
              </button>

              {showSubMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fade-in text-xs space-y-1">
                  <div className="px-2 py-1 font-bold text-slate-800 border-b border-slate-100 flex items-center justify-between">
                    <span>Subtitle Tracks</span>
                    {movieHash && <span className="font-mono text-[9px] text-slate-400">#{movieHash.slice(0, 6)}</span>}
                  </div>

                  <button
                    onClick={() => {
                      setActiveTrack(null)
                      setShowSubMenu(false)
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition ${
                      activeTrack === null ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>Off (None)</span>
                    {activeTrack === null && <Check size={13} />}
                  </button>

                  {localTracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => {
                        setActiveTrack(track)
                        setShowSubMenu(false)
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition text-left ${
                        activeTrack?.id === track.id ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="truncate pr-2">{track.label}</span>
                      {activeTrack?.id === track.id && <Check size={13} className="shrink-0" />}
                    </button>
                  ))}

                  <div className="pt-1 border-t border-slate-100 space-y-1">
                    <button
                      onClick={() => {
                        setShowSubMenu(false)
                        setActiveModalTab('opensubtitles')
                        setShowSearchModal(true)
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-blue-600 font-bold transition cursor-pointer"
                    >
                      <Search size={12} />
                      <span>Search OpenSubtitles...</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowSubMenu(false)
                        setActiveModalTab('ai')
                        setShowSearchModal(true)
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold shadow-sm transition cursor-pointer"
                    >
                      <Sparkles size={12} />
                      <span>✨ AI Subtitles (Whisper)...</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {infoHash && (
              <button
                onClick={handleOpenInSystemPlayer}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open in System Default Player (QuickTime / VLC / IINA)"
              >
                <ExternalLink size={13} />
                <span>Open in System Player</span>
              </button>
            )}

            <button
              onClick={handleClose}
              aria-label="Close video player"
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="relative aspect-video bg-black flex items-center justify-center">
          {hasError ? (
            <div className="p-8 text-center max-w-md space-y-4 bg-white/95 rounded-2xl border border-slate-200 shadow-lg mx-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">Media Playback Notice</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This media container requires external decoding (e.g. MKV/AVI/AC3) or is buffering initial keyframes from swarm peers.
                </p>
                {errorDetails && (
                  <p className="text-[10px] text-rose-500 font-mono break-all bg-rose-50 p-2 rounded-lg mt-2 border border-rose-100">
                    {errorDetails}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {!isTranscoding && infoHash !== undefined && fileIndex !== undefined && (
                  <button
                    onClick={() => {
                      setHasError(false)
                      setErrorDetails(null)
                      setIsTranscoding(true)
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-md inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Cpu size={14} />
                    <span>Transcode to MP4</span>
                  </button>
                )}
                <button
                  onClick={handleOpenInSystemPlayer}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md inline-flex items-center gap-2 cursor-pointer"
                >
                  <Play size={14} className="fill-current" />
                  <span>Open in VLC / System Player</span>
                </button>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              src={effectiveStreamUrl}
              controls
              autoPlay
              playsInline
              crossOrigin="anonymous"
              onError={() => {
                const err = videoRef.current?.error
                const codeMap: Record<number, string> = {
                  1: 'MEDIA_ERR_ABORTED',
                  2: 'MEDIA_ERR_NETWORK',
                  3: 'MEDIA_ERR_DECODE',
                  4: 'MEDIA_ERR_SRC_NOT_SUPPORTED'
                }
                const msg = err ? `${codeMap[err.code] || 'UNKNOWN'} (code ${err.code}): ${err.message}` : 'Unknown video error'
                console.error("Video element error:", msg, effectiveStreamUrl)
                setErrorDetails(`${msg} | URL: ${effectiveStreamUrl}`)
                setHasError(true)
              }}
              className="w-full h-full object-contain"
            >
              {activeTrack && infoHash !== undefined && fileIndex !== undefined && (
                <track
                  key={activeTrack.path}
                  kind="subtitles"
                  src={`${apiBase}/api/torrents/${infoHash}/files/${fileIndex}/subtitles/stream?path=${encodeURIComponent(activeTrack.path)}`}
                  srcLang={activeTrack.language}
                  label={activeTrack.label}
                  default
                />
              )}
              Your browser does not support HTML5 video streaming.
            </video>
          )}

          {/* Subtitles & AI Transcription Modal */}
          {showSearchModal && (
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              onClick={() => setShowSearchModal(false)}
            >
              <div 
                className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4 max-h-[85%] flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                {/* Header & Tabs */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setActiveModalTab('opensubtitles'); setAiError(null); setAiSuccess(null) }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        activeModalTab === 'opensubtitles'
                          ? 'bg-blue-50 text-blue-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <Globe size={14} />
                      <span>OpenSubtitles</span>
                    </button>

                    <button
                      onClick={() => { setActiveModalTab('ai'); setAiError(null); setAiSuccess(null) }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        activeModalTab === 'ai'
                          ? 'bg-purple-50 text-purple-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <Sparkles size={14} />
                      <span>AI Whisper Subtitles</span>
                    </button>
                  </div>

                  <button 
                    onClick={() => setShowSearchModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {activeModalTab === 'opensubtitles' ? (
                  <>
                    <div className="flex gap-2">
                      <select
                        value={searchLang}
                        onChange={(e) => setSearchLang(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                      </select>

                      <button
                        onClick={handleSearchOnline}
                        disabled={isSearching}
                        className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {isSearching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                        <span>Search Online</span>
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scroll min-h-[160px]">
                      {isSearching ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-2">
                          <Loader2 size={24} className="animate-spin text-blue-500" />
                          <p className="text-xs">Searching OpenSubtitles API...</p>
                        </div>
                      ) : onlineResults.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-xs">
                          No online subtitles found. Try a different language.
                        </div>
                      ) : (
                        onlineResults.map((sub) => (
                          <div 
                            key={sub.id} 
                            className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-white transition"
                          >
                            <div className="min-w-0 pr-3">
                              <p className="font-semibold text-xs text-slate-800 truncate" title={sub.release_name}>
                                {sub.release_name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold uppercase">
                                  {sub.language}
                                </span>
                                {sub.is_hash_match && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
                                    ✓ Exact Hash Match
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400">
                                  {sub.download_count} downloads
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDownloadSubtitle(sub)}
                              disabled={isDownloading}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 disabled:opacity-50 shrink-0 cursor-pointer"
                            >
                              <Download size={12} />
                              <span>Get</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  /* AI Whisper Speech-to-Text Tab */
                  <div className="space-y-4 py-1">
                    <div className="p-3 bg-purple-50 border border-purple-100 rounded-2xl text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-purple-800">
                        <Sparkles size={14} />
                        <span>Free Speech-to-Text via Groq Whisper Large v3</span>
                      </div>
                      <p className="text-purple-600 leading-relaxed">
                        Extracts speech audio and transcribes subtitle cues in seconds using Groq LPUs.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Key size={13} className="text-purple-600" />
                        <span>Groq API Key</span>
                        <a 
                          href="https://console.groq.com/keys" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="ml-auto text-[10px] text-purple-600 hover:underline font-semibold"
                        >
                          Get Free API Key ↗
                        </a>
                      </label>
                      <input
                        type="password"
                        placeholder="gsk_..."
                        value={groqApiKey}
                        onChange={(e) => {
                          setGroqApiKey(e.target.value)
                          setStoredGroqKey(e.target.value)
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Spoken Language
                        </label>
                        <select
                          value={searchLang}
                          onChange={(e) => setSearchLang(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="it">Italian</option>
                          <option value="pt">Portuguese</option>
                          <option value="ja">Japanese</option>
                          <option value="zh">Chinese</option>
                          <option value="ko">Korean</option>
                        </select>
                      </div>

                      <div className="flex-1">
                        <button
                          onClick={handleAITranscribe}
                          disabled={isAITranscribing}
                          className="w-full py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md shadow-purple-500/20"
                        >
                          {isAITranscribing ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Transcribing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={13} />
                              <span>Generate Subtitles</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {isAITranscribing && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-600">
                        <Loader2 size={15} className="animate-spin text-purple-600 shrink-0" />
                        <span>Extracting speech and transcribing with Groq LPU...</span>
                      </div>
                    )}

                    {aiError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                        <AlertCircle size={15} className="shrink-0 text-rose-500" />
                        <span className="break-words">{aiError}</span>
                      </div>
                    )}

                    {aiSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
                        <Check size={15} className="shrink-0 text-emerald-500" />
                        <span>{aiSuccess}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
