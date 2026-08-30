import { X, ExternalLink, Play, AlertCircle } from 'lucide-react'
import { useEffect, useRef, useCallback, useState } from 'react'

interface VideoPlayerProps {
  streamUrl: string
  title?: string
  infoHash?: string
  fileIndex?: number
  onClose: () => void
}

export function VideoPlayer({ streamUrl, title, infoHash, fileIndex, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasError, setHasError] = useState(false)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

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
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  const handleOpenInSystemPlayer = async () => {
    if (infoHash !== undefined && fileIndex !== undefined) {
      try {
        const base = (window.location.port === '5173' || window.location.port === '3000') ? 'http://localhost:8080' : ''
        await fetch(`${base}/api/torrents/${infoHash}/files/${fileIndex}/play`, { method: 'POST' })
      } catch (e) {
        console.warn('Failed to open system player:', e)
      }
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/30 backdrop-blur-md p-6 animate-fade-in-up"
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
          </div>

          <div className="flex items-center gap-2">
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
              <button
                onClick={handleOpenInSystemPlayer}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md inline-flex items-center gap-2 cursor-pointer"
              >
                <Play size={14} className="fill-current" />
                <span>Open in VLC / System Player</span>
              </button>
            </div>
          ) : (
            <video
              ref={videoRef}
              src={streamUrl}
              controls
              autoPlay
              playsInline
              onError={() => {
                const err = videoRef.current?.error
                const codeMap: Record<number, string> = {
                  1: 'MEDIA_ERR_ABORTED',
                  2: 'MEDIA_ERR_NETWORK',
                  3: 'MEDIA_ERR_DECODE',
                  4: 'MEDIA_ERR_SRC_NOT_SUPPORTED'
                }
                const msg = err ? `${codeMap[err.code] || 'UNKNOWN'} (code ${err.code}): ${err.message}` : 'Unknown video error'
                console.error("Video element error:", msg, streamUrl)
                setErrorDetails(`${msg} | URL: ${streamUrl}`)
                setHasError(true)
              }}
              className="w-full h-full object-contain"
            >
              Your browser does not support HTML5 video streaming.
            </video>
          )}
        </div>
      </div>
    </div>
  )
}
