import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Settings } from './Settings'

describe('Settings Component', () => {
  beforeEach(() => {
    // Mock the window.torrentApi
    window.torrentApi = {
      getSettings: vi.fn().mockResolvedValue({
        downloadPath: '/downloads',
        downloadLimit: 1024,
        uploadLimit: 2048,
        startOnBoot: false,
        mediaPlayerPath: '',
        rssFeeds: [],
        rssRules: []
      }),
      saveSettings: vi.fn().mockResolvedValue({}),
    } as any
  })

  it('renders download path correctly', async () => {
    render(<Settings />)
    
    // It should load async settings
    const pathInput = await screen.findByDisplayValue('/downloads')
    expect(pathInput).toBeTruthy()
  })
})
