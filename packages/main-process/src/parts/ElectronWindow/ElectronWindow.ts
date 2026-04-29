import * as Electron from 'electron'
import * as GetWindowById from '../GetWindowById/GetWindowById.ts'
import * as Logger from '../Logger/Logger.ts'

export const executeWindowFunction = (browserWindowId: number, key: string): void => {
  const browserWindow = GetWindowById.getWindowById(browserWindowId)
  if (!browserWindow) {
    Logger.info(`[main-process] browser window not found ${browserWindow}`)
    return
  }
  browserWindow[key]()
}

export const executeWebContentsFunction = (browserWindowId: number, key: string, ...args: readonly any[]): void => {
  const browserWindow = GetWindowById.getWindowById(browserWindowId)
  if (!browserWindow) {
    Logger.info(`[main-process] browser window not found ${browserWindow}`)
    return
  }
  browserWindow.webContents[key](...args)
}

export const getFocusedWindow = (): Electron.BrowserWindow | undefined => {
  return Electron.BrowserWindow.getFocusedWindow() || undefined
}

export const findById = (windowId: number) => {
  return GetWindowById.getWindowById(windowId)
}

/**
 * @returns {any}
 */
export const getFocusedWindowId = () => {
  const browserWindow = Electron.BrowserWindow.getFocusedWindow()
  if (!browserWindow) {
    return -1
  }
  return browserWindow.id
}

export const getZoom = (windowId: number): number => {
  if (!windowId) {
    return 1
  }
  const browserWindow = Electron.BrowserWindow.fromId(windowId)
  if (!browserWindow) {
    return 1
  }
  return browserWindow.webContents.getZoomLevel()
}
