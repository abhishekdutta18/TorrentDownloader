import { test, expect, _electron as electron } from '@playwright/test'
import path from 'path'
import fs from 'fs'

let electronApp: any

test.beforeAll(async () => {
  const isMac = process.platform === 'darwin'
  const isWin = process.platform === 'win32'

  let appPath = ''
  const mainPath = path.join(import.meta.dirname, '..', 'dist-electron', 'main.js')

  if (isMac) {
    appPath = path.join(import.meta.dirname, '..', 'release', 'mac-arm64', 'Torrent Downloader.app', 'Contents', 'MacOS', 'Torrent Downloader')
    if (!fs.existsSync(appPath)) {
        appPath = path.join(import.meta.dirname, '..', 'release', 'mac', 'Torrent Downloader.app', 'Contents', 'MacOS', 'Torrent Downloader')
    }
  } else if (isWin) {
    appPath = path.join(import.meta.dirname, '..', 'release', 'win-unpacked', 'Torrent Downloader.exe')
  } else {
    appPath = path.join(import.meta.dirname, '..', 'release', 'linux-unpacked', 'torrent-downloader')
  }

  electronApp = await electron.launch({
    args: [mainPath],
    executablePath: appPath
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
  expect(title).toBe('Torrent Downloader')
  
  // Wait for the Settings tab button to be visible
  const settingsTab = window.locator('button', { hasText: 'Settings' })
  await expect(settingsTab).toBeVisible()
})
