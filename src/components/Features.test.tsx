import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App'
import { sanitizeMagnetInput } from '../utils'
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
          timeRemaining: 150,
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
      stopStream: vi.fn().mockResolvedValue({ success: true }),
      readClipboard: vi.fn().mockResolvedValue('')
    } as any
  })

  it('renders application title', async () => {
    render(<App />)
    expect(await screen.findByText(/OmniFlux/i)).toBeDefined()
  })

  it('correctly formats and displays ETA in seconds', async () => {
    render(<App />)
    expect(await screen.findByText(/ETA 2m 30s/i)).toBeDefined()
  })

  describe('sanitizeMagnetInput', () => {
    const userMagnet = 'magnet:?xt=urn:btih:66D63E9F5A3DC66986583DD01249841651D9E53F&dn=EvilErotic%20-%20Scarlet%20aka%20Scarlet%20Assian%20-%20Collecting%20Rent%20-%20Asian%20Creampie%202160p&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce&tr=udp%3A%2F%2Ftracker.bittor.pw%3A1337%2Fannounce&tr=udp%3A%2F%2Fpublic.popcorn-tracker.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.dler.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce&tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftorrent.gresille.org%3A80%2Fannounce&tr=udp%3A%2F%2Fp4p.arenabg.com%3A1337&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337'

    it('keeps valid magnet link intact', () => {
      expect(sanitizeMagnetInput(userMagnet)).toBe(userMagnet)
    })

    it('trims whitespace and strips surrounding quotes', () => {
      expect(sanitizeMagnetInput(`  "${userMagnet}"  `)).toBe(userMagnet)
      expect(sanitizeMagnetInput(`  '${userMagnet}'  `)).toBe(userMagnet)
    })

    it('strips surrounding angle brackets', () => {
      expect(sanitizeMagnetInput(`<${userMagnet}>`)).toBe(userMagnet)
    })

    it('replaces &amp; HTML entities with &', () => {
      const htmlEncoded = userMagnet.replace(/&/g, '&amp;')
      expect(sanitizeMagnetInput(htmlEncoded)).toBe(userMagnet)
    })

    it('normalizes uppercase MAGNET:? scheme', () => {
      const uppercaseScheme = userMagnet.replace('magnet:?', 'MAGNET:?')
      expect(sanitizeMagnetInput(uppercaseScheme)).toBe(userMagnet)
    })

    it('auto-converts a 40-character hex info hash to a magnet URI', () => {
      const hexHash = '66D63E9F5A3DC66986583DD01249841651D9E53F'
      expect(sanitizeMagnetInput(hexHash)).toBe(`magnet:?xt=urn:btih:${hexHash}`)
    })

    it('auto-converts a 32-character base32 info hash to a magnet URI', () => {
      const b32Hash = 'M3LGYH22HXDGUBTY3XIBESC4HZ45TZT7'
      expect(sanitizeMagnetInput(b32Hash)).toBe(`magnet:?xt=urn:btih:${b32Hash}`)
    })

    it('returns empty string on empty input', () => {
      expect(sanitizeMagnetInput('')).toBe('')
      expect(sanitizeMagnetInput('   ')).toBe('')
    })
  })

  describe('Add Torrent Modal UI & Clipboard Integration', () => {
    const sampleMagnet = 'magnet:?xt=urn:btih:66D63E9F5A3DC66986583DD01249841651D9E53F&dn=Test'

    it('auto-fills magnet link from clipboard when opening Add Torrent modal', async () => {
      const mockReadClipboard = window.torrentApi.readClipboard as any
      mockReadClipboard.mockResolvedValue(sampleMagnet)
      render(<App />)

      const addBtns = screen.getAllByRole('button', { name: /^Add$/i })
      fireEvent.click(addBtns[0])

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/magnet:\?xt=urn:btih:... or info hash or https:\/\/\.\.\./i) as HTMLInputElement
        expect(input.value).toBe(sampleMagnet)
      })
    })

    it('allows pasting into input via the Paste button in Add modal', async () => {
      const mockReadClipboard = window.torrentApi.readClipboard as any
      mockReadClipboard.mockResolvedValue('')
      render(<App />)

      const addBtns = screen.getAllByRole('button', { name: /^Add$/i })
      fireEvent.click(addBtns[0])

      const input = await screen.findByPlaceholderText(/magnet:\?xt=urn:btih:... or info hash or https:\/\/\.\.\./i) as HTMLInputElement
      expect(input.value).toBe('')

      mockReadClipboard.mockResolvedValue(sampleMagnet)

      const pasteBtn = screen.getByRole('button', { name: /Paste/i })
      fireEvent.click(pasteBtn)

      await waitFor(() => {
        expect(input.value).toBe(sampleMagnet)
      })

      const downloadBtn = screen.getByRole('button', { name: /Start Download/i })
      fireEvent.click(downloadBtn)

      await waitFor(() => {
        expect(window.torrentApi.addTorrent).toHaveBeenCalledWith(sampleMagnet, undefined)
      })
    })
  })
})
