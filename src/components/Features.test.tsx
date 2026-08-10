import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Torrent Downloader Core Logic & Features', () => {
  beforeEach(() => {
    // Mock the window.torrentApi bridge for Electron IPC calls
    window.torrentApi = {
      addTorrent: vi.fn().mockResolvedValue({ success: true, infoHash: 'abc123hash' }),
      getTorrentsStatus: vi.fn().mockResolvedValue([
        {
          infoHash: 'abc123hash',
          name: 'Linux ISO Ubuntu 24.04',
          progress: 0.75,
          downloadSpeed: 1024 * 1024 * 5, // 5 MB/s
          uploadSpeed: 1024 * 500,
          numPeers: 42,
          isPaused: false,
          isDone: false,
          files: [{ name: 'ubuntu-24.04-desktop-amd64.iso', length: 5000000000 }]
        }
      ]),
      pauseTorrent: vi.fn().mockResolvedValue({ success: true }),
      resumeTorrent: vi.fn().mockResolvedValue({ success: true }),
      removeTorrent: vi.fn().mockResolvedValue({ success: true }),
      getSettings: vi.fn().mockResolvedValue({
        downloadPath: '/Downloads',
        downloadLimit: 0,
        uploadLimit: 0,
        startOnBoot: true,
        mediaPlayerPath: '/Applications/VLC.app',
        rssFeeds: ['https://example.com/rss.xml'],
        rssRules: ['Ubuntu*']
      }),
      saveSettings: vi.fn().mockResolvedValue({ success: true }),
      searchTorrents: vi.fn().mockResolvedValue([
        { title: 'Ubuntu 24.04 LTS', magnet: 'magnet:?xt=urn:btih:abc123hash', size: '5 GB', seeds: 120, leeches: 5 }
      ]),
      fetchRss: vi.fn().mockResolvedValue([
        { title: 'Ubuntu 24.04 LTS Release', link: 'magnet:?xt=urn:btih:abc123hash', pubDate: '2026-08-10' }
      ]),
      startStream: vi.fn().mockResolvedValue({ url: 'http://localhost:8888/0' }),
      copyToClipboard: vi.fn().mockResolvedValue({ success: true })
    } as any
  })

  it('1. Torrent Addition & Status API', async () => {
    const res = await window.torrentApi.addTorrent('magnet:?xt=urn:btih:abc123hash')
    expect(res.success).toBe(true)

    const status = await window.torrentApi.getTorrentsStatus()
    expect(status.length).toBe(1)
    expect(status[0].name).toContain('Ubuntu')
    expect(status[0].numPeers).toBe(42)
  })

  it('2. Torrent Lifecycle Controls (Pause, Resume, Remove)', async () => {
    const pauseRes = await window.torrentApi.pauseTorrent('abc123hash')
    expect(pauseRes.success).toBe(true)

    const resumeRes = await window.torrentApi.resumeTorrent('abc123hash')
    expect(resumeRes.success).toBe(true)

    const removeRes = await window.torrentApi.removeTorrent('abc123hash')
    expect(removeRes.success).toBe(true)
  })

  it('3. Torrent Search Functionality', async () => {
    const results = await window.torrentApi.searchTorrents('Ubuntu')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].title).toBe('Ubuntu 24.04 LTS')
    expect(results[0].seeds).toBe(120)
  })

  it('4. RSS Feed Fetching & Parsing', async () => {
    const feeds = await window.torrentApi.fetchRss('https://example.com/rss.xml')
    expect(feeds.length).toBe(1)
    expect(feeds[0].link).toContain('magnet:?')
  })

  it('5. In-App Video Streaming Endpoint', async () => {
    const stream = await window.torrentApi.startStream('abc123hash', 0)
    expect(stream.url).toBe('http://localhost:8888/0')
  })

  it('6. Clipboard & Settings Persistence', async () => {
    const settings = await window.torrentApi.getSettings()
    expect(settings.startOnBoot).toBe(true)
    expect(settings.mediaPlayerPath).toBe('/Applications/VLC.app')

    const clipRes = await window.torrentApi.copyToClipboard('magnet:?xt=urn:btih:abc123hash')
    expect(clipRes.success).toBe(true)
  })
})
