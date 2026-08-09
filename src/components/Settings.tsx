import { useState, useEffect, useRef } from 'react'

interface AppSettings {
  downloadPath: string
  downloadLimit: number
  uploadLimit: number
  startOnBoot: boolean
  mediaPlayerPath: string
  rssFeeds: string[]
  rssRules: string[]
}

export function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadKB, setUploadKB] = useState('')
  const [downloadKB, setDownloadKB] = useState('')
  const [feedInput, setFeedInput] = useState('')
  const [ruleInput, setRuleInput] = useState('')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const settingsRef = useRef<AppSettings | null>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    if (window.torrentApi) {
      window.torrentApi.getSettings().then((s) => {
        if (!isMounted.current) return
        setSettings(s)
        settingsRef.current = s
        setUploadKB(s.uploadLimit > 0 ? String(Math.round(s.uploadLimit / 1024)) : '0')
        setDownloadKB(s.downloadLimit > 0 ? String(Math.round(s.downloadLimit / 1024)) : '0')
      })
    }
    return () => {
      isMounted.current = false
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  if (!settings) return null
  settingsRef.current = settings

  const debouncedSave = (updates: Partial<AppSettings>) => {
    const nextSettings = { ...settingsRef.current!, ...updates }
    setSettings(nextSettings)
    settingsRef.current = nextSettings

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      if (!isMounted.current) return
      setSaving(true)
      if (window.torrentApi) {
        const saved = await window.torrentApi.saveSettings(settingsRef.current!)
        if (isMounted.current) {
          setSettings(saved)
          settingsRef.current = saved
        }
      }
      if (isMounted.current) setSaving(false)
    }, 800)
  }

  const handleSelectFolder = async () => {
    if (window.torrentApi) {
      const folder = await window.torrentApi.selectFolder()
      if (folder) {
        const newSettings = { ...settings, downloadPath: folder }
        setSettings(newSettings)
        setSaving(true)
        if (window.torrentApi) {
          const saved = await window.torrentApi.saveSettings(newSettings)
          setSettings(saved)
        }
        setSaving(false)
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700/50 shadow-sm">
        <h3 className="text-xl font-semibold mb-6 text-gray-100 border-b border-gray-700 pb-2">Download Locations</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Default Download Path</label>
            <div className="flex space-x-3">
              <input 
                type="text" 
                value={settings.downloadPath}
                readOnly
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 focus:outline-none"
              />
              <button 
                onClick={handleSelectFolder}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors font-medium"
              >
                Change
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Preferred External Media Player</label>
            <div className="flex space-x-3 items-center">
              <input 
                type="text" 
                value={settings.mediaPlayerPath || 'Not set (will prompt on first use)'}
                readOnly
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-500 focus:outline-none"
              />
              {settings.mediaPlayerPath && (
                <button 
                  onClick={async () => {
                    if (window.torrentApi) {
                      await window.torrentApi.clearMediaPlayer()
                      setSettings({ ...settings, mediaPlayerPath: '' })
                    }
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-red-600 text-gray-200 hover:text-white rounded-lg transition-colors font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700/50 shadow-sm">
        <h3 className="text-xl font-semibold mb-6 text-gray-100 border-b border-gray-700 pb-2">Bandwidth Limiting</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Global Maximum Upload Speed (KB/s)</label>
            <input 
              type="number" 
              min="0"
              value={uploadKB}
              onChange={(e) => {
                setUploadKB(e.target.value)
                const val = parseInt(e.target.value) || 0
                debouncedSave({ uploadLimit: val > 0 ? val * 1024 : 0 })
              }}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="0 for unlimited"
            />
            <p className="text-xs text-gray-500 mt-1">Set to 0 for unlimited speed.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Global Maximum Download Speed (KB/s)</label>
            <input 
              type="number" 
              min="0"
              value={downloadKB}
              onChange={(e) => {
                setDownloadKB(e.target.value)
                const val = parseInt(e.target.value) || 0
                debouncedSave({ downloadLimit: val > 0 ? val * 1024 : 0 })
              }}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="0 for unlimited"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700/50 shadow-sm">
        <h3 className="text-xl font-semibold mb-6 text-gray-100 border-b border-gray-700 pb-2">RSS Auto-Downloader</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">RSS Feeds (URLs)</label>
            <div className="flex space-x-2 mb-3">
              <input 
                type="url"
                value={feedInput}
                onChange={(e) => setFeedInput(e.target.value)}
                placeholder="https://example.com/rss.xml"
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none"
              />
              <button 
                onClick={() => {
                  if (feedInput.trim()) {
                    debouncedSave({ rssFeeds: [...(settings.rssFeeds || []), feedInput.trim()] })
                    setFeedInput('')
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
              >
                Add
              </button>
            </div>
            <ul className="space-y-2 max-h-32 overflow-y-auto">
              {(settings.rssFeeds || []).map((feed, idx) => (
                <li key={idx} className="flex justify-between items-center bg-gray-900 p-2 rounded border border-gray-700">
                  <span className="text-sm text-gray-300 truncate pr-4">{feed}</span>
                  <button 
                    onClick={() => {
                      const newFeeds = [...settings.rssFeeds]
                      newFeeds.splice(idx, 1)
                      debouncedSave({ rssFeeds: newFeeds })
                    }}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Auto-Download Rules (Regex / Keywords)</label>
            <div className="flex space-x-2 mb-3">
              <input 
                type="text"
                value={ruleInput}
                onChange={(e) => setRuleInput(e.target.value)}
                placeholder="e.g. 1080p.*Linux"
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none"
              />
              <button 
                onClick={() => {
                  if (ruleInput.trim()) {
                    debouncedSave({ rssRules: [...(settings.rssRules || []), ruleInput.trim()] })
                    setRuleInput('')
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
              >
                Add
              </button>
            </div>
            <ul className="space-y-2 max-h-32 overflow-y-auto">
              {(settings.rssRules || []).map((rule, idx) => (
                <li key={idx} className="flex justify-between items-center bg-gray-900 p-2 rounded border border-gray-700">
                  <span className="text-sm text-gray-300 font-mono truncate pr-4">{rule}</span>
                  <button 
                    onClick={() => {
                      const newRules = [...settings.rssRules]
                      newRules.splice(idx, 1)
                      debouncedSave({ rssRules: newRules })
                    }}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {saving && <p className="text-sm text-gray-400 text-center animate-pulse">Saving changes...</p>}
    </div>
  )
}
