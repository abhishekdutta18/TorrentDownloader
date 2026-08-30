import { useState, useEffect, useRef } from 'react'
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react'

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
    <div className="max-w-2xl mx-auto w-full space-y-4 text-xs text-slate-800">
      
      {/* Download Locations */}
      <div className="glass-card bg-white/80 p-5 rounded-2xl border border-white shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200/70 pb-2">Download & Player Settings</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Default Download Folder</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={settings.downloadPath}
                readOnly
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-mono"
              />
              <button 
                onClick={handleSelectFolder}
                className="glass-btn px-3 py-1.5 rounded-xl font-semibold text-slate-700 hover:text-slate-900"
              >
                Change
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Preferred Media Player</label>
            <div className="flex gap-2 items-center">
              <input 
                type="text" 
                value={settings.mediaPlayerPath || 'Embedded In-Process OmniPlayer (Default)'}
                readOnly
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-mono"
              />
              <button 
                type="button"
                onClick={() => {
                  const omniPath = '/Users/nandadulaldutta/Desktop/Media Player/OmniPlayer.app'
                  setSettings({ ...settings, mediaPlayerPath: omniPath })
                  debouncedSave({ mediaPlayerPath: omniPath })
                }}
                className="glass-btn-primary px-3 py-1.5 rounded-xl font-bold whitespace-nowrap"
              >
                Use OmniPlayer
              </button>
              {settings.mediaPlayerPath && (
                <button 
                  onClick={async () => {
                    if (window.torrentApi) {
                      await window.torrentApi.clearMediaPlayer()
                      setSettings({ ...settings, mediaPlayerPath: '' })
                      debouncedSave({ mediaPlayerPath: '' })
                    }
                  }}
                  className="glass-btn px-3 py-1.5 rounded-xl font-semibold text-red-600 hover:text-red-700"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200/70">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-slate-700">Scheduled Speed Throttling</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.scheduledThrottleEnabled || false} 
                onChange={(e) => debouncedSave({ scheduledThrottleEnabled: e.target.checked })}
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {settings.scheduledThrottleEnabled && (
            <div className="space-y-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/60">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Start Time</label>
                  <input type="time" value={settings.scheduledThrottleStart || '09:00'} onChange={(e) => debouncedSave({ scheduledThrottleStart: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg p-1.5" />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">End Time</label>
                  <input type="time" value={settings.scheduledThrottleEnd || '17:00'} onChange={(e) => debouncedSave({ scheduledThrottleEnd: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg p-1.5" />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">DL Limit (KB/s)</label>
                  <input type="number" value={settings.scheduledDownloadLimit ? Math.round(settings.scheduledDownloadLimit/1024) : 0} onChange={(e) => { const v = parseInt(e.target.value)||0; debouncedSave({ scheduledDownloadLimit: v > 0 ? v*1024 : 0 }) }} className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-mono" />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">UL Limit (KB/s)</label>
                  <input type="number" value={settings.scheduledUploadLimit ? Math.round(settings.scheduledUploadLimit/1024) : 0} onChange={(e) => { const v = parseInt(e.target.value)||0; debouncedSave({ scheduledUploadLimit: v > 0 ? v*1024 : 0 }) }} className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-mono" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="glass-card bg-white/80 p-5 rounded-2xl border border-white shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200/70 pb-2">Custom Categories</h3>
        <div className="flex gap-2">
          <input 
            type="text"
            id="newCatName"
            placeholder="Category name (e.g. 4K Cinema, Podcasts)"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5"
          />
          <button 
            onClick={async () => {
              const nameEl = document.getElementById('newCatName') as HTMLInputElement;
              const name = nameEl.value.trim();
              if (!name) return;
              if (window.torrentApi) {
                const folder = await window.torrentApi.selectFolder();
                if (folder) {
                  const newCats = { ...(settings.categories || {}) };
                  newCats[name] = folder;
                  debouncedSave({ categories: newCats });
                  nameEl.value = '';
                }
              }
            }}
            className="glass-btn px-3 py-1.5 rounded-xl font-semibold text-blue-600 hover:text-blue-700"
          >
            Add Category...
          </button>
        </div>
        
        {Object.entries(settings.categories || {}).length > 0 && (
          <ul className="space-y-1.5 mt-2">
            {Object.entries(settings.categories || {}).map(([catName, catPath]) => (
              <li key={catName} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                <div className="flex flex-col truncate pr-2">
                  <span className="font-bold text-slate-800">{catName}</span>
                  <span className="text-[10px] text-slate-400 font-mono truncate">{catPath}</span>
                </div>
                <button 
                  onClick={() => {
                    const newCats = { ...settings.categories };
                    delete newCats[catName];
                    debouncedSave({ categories: newCats });
                  }}
                  className="text-red-500 hover:text-red-700 font-semibold px-2 py-1"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bandwidth Limiting */}
      <div className="glass-card bg-white/80 p-5 rounded-2xl border border-white shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200/70 pb-2">Bandwidth & Queue Limits</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Max Active Swarms</label>
            <input 
              type="number" 
              min="1"
              max="30"
              value={settings.maxActiveDownloads || 3}
              onChange={(e) => debouncedSave({ maxActiveDownloads: parseInt(e.target.value) || 3 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Upload Cap (KB/s)</label>
            <input 
              type="number" 
              min="0"
              value={uploadKB}
              onChange={(e) => {
                setUploadKB(e.target.value)
                const val = parseInt(e.target.value) || 0
                debouncedSave({ uploadLimit: val > 0 ? val * 1024 : 0 })
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-mono"
              placeholder="0 (unlimited)"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Download Cap (KB/s)</label>
            <input 
              type="number" 
              min="0"
              value={downloadKB}
              onChange={(e) => {
                setDownloadKB(e.target.value)
                const val = parseInt(e.target.value) || 0
                debouncedSave({ downloadLimit: val > 0 ? val * 1024 : 0 })
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-mono"
              placeholder="0 (unlimited)"
            />
          </div>
        </div>
      </div>

      {/* RSS Auto-Downloader */}
      <div className="glass-card bg-white/80 p-5 rounded-2xl border border-white shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200/70 pb-2">RSS Auto-Downloader</h3>
        <div className="flex gap-2">
          <input 
            type="url"
            value={feedInput}
            onChange={(e) => setFeedInput(e.target.value)}
            placeholder="https://example.com/rss.xml"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5"
          />
          <button 
            onClick={() => {
              if (feedInput.trim()) {
                debouncedSave({ rssFeeds: [...(settings.rssFeeds || []), feedInput.trim()] })
                setFeedInput('')
              }
            }}
            className="glass-btn-primary px-3 py-1.5 rounded-xl font-semibold"
          >
            Add Feed
          </button>
        </div>

        {settings.rssFeeds && settings.rssFeeds.length > 0 && (
          <ul className="space-y-1.5 max-h-28 overflow-y-auto">
            {settings.rssFeeds.map((feed, idx) => (
              <li key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                <span className="font-mono text-[10px] text-slate-600 truncate pr-2">{feed}</span>
                <button 
                  onClick={() => {
                    const newFeeds = [...settings.rssFeeds]
                    newFeeds.splice(idx, 1)
                    debouncedSave({ rssFeeds: newFeeds })
                  }}
                  className="text-red-500 hover:text-red-700 font-semibold px-1"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Malware & Threat Protection */}
      <div className="glass-card bg-white/80 p-5 rounded-2xl border border-white shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2">
          <Shield className="text-blue-600" size={16} />
          <h3 className="text-sm font-bold text-slate-900">Anti-Malware & Threat Protection</h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input 
              type="checkbox"
              checked={settings.enableMalwareProtection !== false}
              onChange={(e) => {
                const val = e.target.checked
                debouncedSave({ enableMalwareProtection: val })
              }}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <span className="font-semibold text-slate-700 block">Enable Real-Time Threat Scanning</span>
              <span className="text-[11px] text-slate-500 block">
                Screens incoming torrent metadata for malicious files and tags completed downloads with macOS Gatekeeper quarantine.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input 
              type="checkbox"
              checked={!!settings.autoSkipRiskyFiles}
              onChange={(e) => {
                const val = e.target.checked
                debouncedSave({ autoSkipRiskyFiles: val })
              }}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <span className="font-semibold text-slate-700 block">Auto-Skip Risky Executable Files</span>
              <span className="text-[11px] text-slate-500 block">
                Automatically deselects scripts and binaries (.exe, .scr, .bat, .vbs, .ps1, etc.) upon torrent metadata arrival.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input 
              type="checkbox"
              checked={settings.enableCloudLookup !== false}
              onChange={(e) => {
                const val = e.target.checked
                debouncedSave({ enableCloudLookup: val })
              }}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <span className="font-semibold text-slate-700 block">Cloud Threat Intelligence (MalwareBazaar)</span>
              <span className="text-[11px] text-slate-500 block">
                Checks cryptographic SHA-256 hashes against MalwareBazaar to detect confirmed malware payloads.
              </span>
            </div>
          </label>
        </div>
      </div>
      
      {saving && <p className="text-xs text-blue-600 font-semibold text-center animate-pulse">Saving changes...</p>}
    </div>
  )
}
