import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'
import React from 'react'

describe('Torrent Downloader UI Tests', () => {
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
          paused: false,
          done: false,
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
        rssFeeds: [],
        rssRules: []
      }),
      saveSettings: vi.fn().mockResolvedValue({ success: true }),
      searchTorrents: vi.fn().mockResolvedValue([]),
      fetchRss: vi.fn().mockResolvedValue([]),
      startStream: vi.fn().mockResolvedValue('http://localhost:8888/0'),
      copyToClipboard: vi.fn().mockResolvedValue({ success: true }),
      onClipboardMagnet: vi.fn().mockReturnValue(() => {}),
      selectFolder: vi.fn().mockResolvedValue({ canceled: true, filePaths: [] }),
      openFolder: vi.fn().mockResolvedValue({ success: true }),
      playExternal: vi.fn().mockResolvedValue({ success: true }),
      setSequential: vi.fn().mockResolvedValue({ success: true }),
      skipFile: vi.fn().mockResolvedValue({ success: true }),
      unskipFile: vi.fn().mockResolvedValue({ success: true }),
      setSpeedLimit: vi.fn().mockResolvedValue({ success: true }),
      stopStream: vi.fn().mockResolvedValue({ success: true })
    } as any
  })

  it('renders application title', async () => {
    render(<App />)
    expect(await screen.findByText(/Torrent Downloader/i)).toBeDefined()
  })
})
