import * as Electron from 'electron'
import * as GetWindowById from '../GetWindowById/GetWindowById.ts'
import * as Logger from '../Logger/Logger.ts'

const devtoolsBeforeInputListeners = new WeakMap<any, any>()
const devtoolsOptions = {
  mode: 'bottom',
}

const isToggleDevtoolsInput = (input) => {
  if (input.type !== 'keyDown') {
    return false
  }
  if (!input.shift) {
    return false
  }
  if (!input.control && !input.meta) {
    return false
  }
  return input.code === 'KeyI' || input.key === 'I' || input.key === 'i'
}

const removeDevtoolsKeyListener = (devtoolsWebContents) => {
  const listener = devtoolsBeforeInputListeners.get(devtoolsWebContents)
  if (!listener) {
    return
  }
  devtoolsBeforeInputListeners.delete(devtoolsWebContents)
  devtoolsWebContents.off('before-input-event', listener)
}

const attachDevtoolsKeyListener = (browserWindow: Electron.BrowserWindow) => {
  const devtoolsWebContents = browserWindow.webContents.devToolsWebContents
  if (!devtoolsWebContents) {
    return
  }
  if (devtoolsBeforeInputListeners.has(devtoolsWebContents)) {
    return
  }
  const listener = (event, input) => {
    if (!isToggleDevtoolsInput(input)) {
      return
    }
    event.preventDefault()
    browserWindow.webContents.closeDevTools()
  }
  devtoolsBeforeInputListeners.set(devtoolsWebContents, listener)
  devtoolsWebContents.on('before-input-event', listener)
  devtoolsWebContents.once('destroyed', () => {
    removeDevtoolsKeyListener(devtoolsWebContents)
  })
  browserWindow.webContents.once('devtools-closed', () => {
    removeDevtoolsKeyListener(devtoolsWebContents)
  })
}

const getBrowserWindow = (browserWindowId) => {
  const browserWindow = GetWindowById.getWindowById(browserWindowId)
  if (!browserWindow) {
    Logger.info(`[main-process] browser window not found ${browserWindow}`)
    return undefined
  }
  return browserWindow
}

const toggleDevtools = (browserWindow) => {
  if (browserWindow.webContents.isDevToolsOpened()) {
    browserWindow.webContents.closeDevTools()
    return
  }
  if (browserWindow.webContents.devToolsWebContents) {
    attachDevtoolsKeyListener(browserWindow)
  } else {
    browserWindow.webContents.once('devtools-opened', () => {
      attachDevtoolsKeyListener(browserWindow)
    })
  }
  browserWindow.webContents.openDevTools(devtoolsOptions)
}

const toggleFullScreen = (browserWindow: Electron.BrowserWindow) => {
  browserWindow.setFullScreen(!browserWindow.isFullScreen())
}

export const executeWindowFunction = (browserWindowId, key) => {
  const browserWindow = getBrowserWindow(browserWindowId)
  if (!browserWindow) {
    return
  }
  if (key === 'toggleDevtools') {
    toggleDevtools(browserWindow)
    return
  }
  if (key === 'toggleFullScreen') {
    toggleFullScreen(browserWindow)
    return
  }
  browserWindow[key]()
}

export const executeWebContentsFunction = (browserWindowId, key, ...args) => {
  const browserWindow = getBrowserWindow(browserWindowId)
  if (!browserWindow) {
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
