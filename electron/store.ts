import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import os from 'node:os'

export interface AppSettings {
  downloadPath: string
  downloadLimit: number
  uploadLimit: number
  startOnBoot: boolean
  mediaPlayerPath: string
  rssFeeds: string[]
  rssRules: string[]
}

export interface AppState {
  activeTorrents: string[] // Array of magnet links
  pausedTorrents: string[] // Array of infoHashes
  skippedFiles: Record<string, number[]> // infoHash -> array of skipped file indices
  torrentPaths: Record<string, string> // infoHash -> download path
  processedRssLinks: string[] // List of RSS links already downloaded
  completedTorrents: string[] // Array of infoHashes that are completed
}

class Store {
  private _settings: AppSettings | null = null
  private _state: AppState | null = null
  private writeQueue: Promise<void> = Promise.resolve()
  
  private get settingsPath() {
    return path.join(app.getPath('userData'), 'settings.json')
  }

  private get statePath() {
    return path.join(app.getPath('userData'), 'state.json')
  }

  public get settings(): AppSettings {
    if (!this._settings) this._settings = this.loadSettings()
    return this._settings
  }

  public get state(): AppState {
    if (!this._state) this._state = this.loadState()
    return this._state
  }

  private loadSettings(): AppSettings {
    const defaults: AppSettings = {
      downloadPath: path.join(os.homedir(), 'Downloads'),
      downloadLimit: 0,
      uploadLimit: 0,
      startOnBoot: false,
      mediaPlayerPath: '',
      rssFeeds: [],
      rssRules: [],
    }
    try {
      if (fs.existsSync(this.settingsPath)) {
        const loaded = JSON.parse(fs.readFileSync(this.settingsPath, 'utf-8'))
        return { ...defaults, ...loaded }
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
    return defaults
  }

  private loadState(): AppState {
    // M6: Merge with defaults so missing fields don't crash
    const defaults: AppState = {
      activeTorrents: [],
      pausedTorrents: [],
      skippedFiles: {},
      torrentPaths: {},
      processedRssLinks: [],
      completedTorrents: [],
    }
    try {
      if (fs.existsSync(this.statePath)) {
        const loaded = JSON.parse(fs.readFileSync(this.statePath, 'utf-8'))
        return { ...defaults, ...loaded }
      }
    } catch (err) {
      console.error('Failed to load state:', err)
    }
    return defaults
  }

  public saveSettings(newSettings: Partial<AppSettings>) {
    this._settings = { ...this.settings, ...newSettings }
    if (!this._settings.rssFeeds) this._settings.rssFeeds = []
    if (!this._settings.rssRules) this._settings.rssRules = []
    
    const data = JSON.stringify(this._settings, null, 2)
    const tempPath = this.settingsPath + '.tmp'
    
    this.writeQueue = this.writeQueue.then(() => {
      return fs.promises.writeFile(tempPath, data, 'utf-8')
        .then(() => fs.promises.rename(tempPath, this.settingsPath))
        .catch(err => console.error('Failed to save settings:', err))
    })
  }

  public saveState(
    activeTorrents?: string[],
    pausedTorrents?: string[],
    skippedFiles?: Record<string, number[]>,
    torrentPaths?: Record<string, string>,
    processedRssLinks?: string[],
    completedTorrents?: string[]
  ) {
    const current = this.state
    this._state = {
      activeTorrents: activeTorrents !== undefined ? activeTorrents : current.activeTorrents,
      pausedTorrents: pausedTorrents !== undefined ? pausedTorrents : current.pausedTorrents,
      skippedFiles: skippedFiles !== undefined ? skippedFiles : current.skippedFiles,
      torrentPaths: torrentPaths !== undefined ? torrentPaths : current.torrentPaths,
      processedRssLinks: processedRssLinks !== undefined ? processedRssLinks : current.processedRssLinks,
      completedTorrents: completedTorrents !== undefined ? completedTorrents : current.completedTorrents,
    }
    const data = JSON.stringify(this._state, null, 2)
    const tempPath = this.statePath + '.tmp'
    
    this.writeQueue = this.writeQueue.then(() => {
      return fs.promises.writeFile(tempPath, data, 'utf-8')
        .then(() => fs.promises.rename(tempPath, this.statePath))
        .catch(err => console.error('Failed to save state:', err))
    })
  }

  public waitForWrites(): Promise<void> {
    return this.writeQueue
  }
}

export const store = new Store()
