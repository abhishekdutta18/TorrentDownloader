import { X } from 'lucide-react'
import { useEffect, useRef, useCallback } from 'react'

interface VideoPlayerProps {
  streamUrl: string
  onClose: () => void
}

export function VideoPlayer({ streamUrl, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Cleanup video element before closing to release resources
  const handleClose = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.removeAttribute('src')
      videoRef.current.load() // Force release of network resources
    }
    onClose()
  }, [onClose])

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200 group"
      role="dialog"
      aria-modal="true"
      aria-label="Video Player"
    >
      <div className="relative w-full max-w-6xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
        <button
          onClick={handleClose}
          aria-label="Close video player"
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors focus:opacity-100 opacity-0 hover:opacity-100 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
        >
          <X size={24} />
        </button>
        
        <video
          ref={videoRef}
          src={streamUrl}
          controls
          autoPlay
          className="w-full h-full object-contain"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  )
}
