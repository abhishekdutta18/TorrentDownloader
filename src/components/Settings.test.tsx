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
        rssRules: [],
        enableMalwareProtection: true,
        autoSkipRiskyFiles: true,
        enableCloudLookup: true
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

  it('renders anti-malware and threat protection settings', async () => {
    render(<Settings />)

    const heading = await screen.findByText('Anti-Malware & Threat Protection')
    expect(heading).toBeTruthy()

    const realTimeToggle = screen.getByText('Enable Real-Time Threat Scanning')
    expect(realTimeToggle).toBeTruthy()

    const autoSkipToggle = screen.getByText('Auto-Skip Risky Executable Files')
    expect(autoSkipToggle).toBeTruthy()

    const cloudLookupToggle = screen.getByText('Cloud Threat Intelligence (MalwareBazaar)')
    expect(cloudLookupToggle).toBeTruthy()
  })
})
