import { test, expect, _electron as electron } from '@playwright/test'
import { findLatestBuild, parseElectronApp } from 'electron-playwright-helpers'
import path from 'path'

let electronApp: any

test.beforeAll(async () => {
  const appPath = path.join(import.meta.dirname, '..', 'release', 'mac-arm64', 'Torrent Downloader.app')
  const appInfo = parseElectronApp(appPath)

  electronApp = await electron.launch({
    args: [appInfo.main],
    executablePath: appInfo.executable
  })
})

test.afterAll(async () => {
  if (electronApp) {
    await electronApp.close()
  }
})

test('app should open and show the main window', async () => {
  const window = await electronApp.firstWindow()
  const title = await window.title()
  expect(title).toBe('TorrentPro')
  
  // Wait for the Settings tab button to be visible
  const settingsTab = window.locator('button', { hasText: 'Settings' })
  await expect(settingsTab).toBeVisible()
})
