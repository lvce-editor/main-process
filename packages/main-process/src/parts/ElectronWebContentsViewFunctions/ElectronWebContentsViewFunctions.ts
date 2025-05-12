import type { BrowserView, WebContents, WebContentsView } from 'electron'
import { BrowserWindow } from 'electron'
import * as Assert from '../Assert/Assert.ts'
import * as Debug from '../Debug/Debug.ts'
import * as ElectronWebContentsViewState from '../ElectronWebContentsViewState/ElectronWebContentsViewState.ts'
import { VError } from '../VError/VError.ts'
import * as WebContentsViewErrorPath from '../WebContentsViewErrorPath/WebContentsViewErrorPath.ts'

// TODO create output channel for browser view debug logs

export const wrapBrowserViewCommand = (fn) => {
  const wrappedCommand = (id, ...args) => {
    const state = ElectronWebContentsViewState.get(id)
    if (!state) {
      console.log(`[main process] no browser view with id ${id}`)
      return
    }
    const { view } = state
    return fn(view, ...args)
  }
  return wrappedCommand
}

export const resizeBrowserView = (view: BrowserView, x: number, y: number, width: number, height: number) => {
  Assert.object(view)
  Assert.number(x)
  Assert.number(y)
  Assert.number(width)
  Assert.number(height)
  view.setBounds({
    x,
    y,
    width,
    height,
  })
}

export const setIframeSrcFallback = async (view, code, message) => {
  await view.webContents.loadFile(WebContentsViewErrorPath.webContentsViewErrorPath, {
    query: {
      code,
      message,
    },
  })
}

// @ts-ignore
const getTitle = (webContents: WebContents) => {
  const title = webContents.getTitle()
  if (title) {
    return title
  }
  return webContents.getURL()
}

export const setIframeSrc = async (view: BrowserView, iframeSrc: string) => {
  try {
    Assert.object(view)
    Assert.string(iframeSrc)
    const { webContents } = view
    await webContents.loadURL(iframeSrc)
  } catch (error) {
    const betterError = new VError(error, `Failed to set iframe src`)
    // @ts-ignore
    betterError.dontPrint = true
    throw betterError
  }
}

export const focus = (view: BrowserView) => {
  const { webContents } = view
  webContents.focus()
}

export const openDevtools = (view: BrowserView) => {
  const { webContents } = view
  // TODO return promise that resolves once devtools are actually open
  webContents.openDevTools()
}

const getSlimCode = (html: string): string => {
  let result = html
  result = result.replaceAll(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi, '')
  result = result.replaceAll(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style\s*>/gi, '')
  return result
}

export const getDomTree = async (view: WebContentsView) => {
  const { webContents } = view
  const code = `document.body.outerHTML`
  const result = await webContents.executeJavaScript(code)
  const slimCode = getSlimCode(result)
  return slimCode
}

export const reload = (view: BrowserView) => {
  const { webContents } = view
  webContents.reload()
}

export const forward = (view: BrowserView) => {
  const { webContents } = view
  webContents.navigationHistory.goForward()
}

export const backward = (view: BrowserView) => {
  // TODO return promise that resolves once devtools are actually open
  const { webContents } = view
  webContents.navigationHistory.goBack()
}

export const cancelNavigation = (view: BrowserView) => {
  const { webContents } = view
  ElectronWebContentsViewState.setCanceled(webContents.id)
  Debug.debug(`[main process] canceled navigation to ${webContents.getURL()}`)
  webContents.stop()
  if (webContents.navigationHistory.canGoBack()) {
    webContents.navigationHistory.goBack()
  }
}

export const show = (id) => {
  // console.log('[main-process] show browser view', id)
  const state = ElectronWebContentsViewState.get(id)
  if (!state) {
    Debug.debug('[main-process] failed to show browser view', id)
    return
  }
  const { view, browserWindow } = state
  browserWindow.contentView.addChildView(view)
}

export const addToWindow = (browserWindowId, browserViewId) => {
  const state = ElectronWebContentsViewState.get(browserViewId)
  const { view } = state
  const browserWindow = BrowserWindow.fromId(browserWindowId)
  if (!browserWindow) {
    return
  }
  browserWindow.contentView.addChildView(view)
}

export const hide = (id) => {
  const state = ElectronWebContentsViewState.get(id)
  if (!state) {
    Debug.debug('[main-process] failed to hide browser view', id)
    return
  }
  const { view, browserWindow } = state
  browserWindow.contentView.removeChildView(view)
}

/**
 *
 * @param {Electron.BrowserView} view
 * @param {number} x
 * @param {number} y
 */
export const inspectElement = (view, x, y) => {
  Assert.number(x)
  Assert.number(y)
  const { webContents } = view
  webContents.inspectElement(x, y)
}

/**
 *
 * @param {Electron.BrowserView} view
 * @param {string} backgroundColor
 */
export const setBackgroundColor = (view, backgroundColor) => {
  view.setBackgroundColor(backgroundColor)
}

/**
 *
 * @param {Electron.BrowserView} view
 * @param {number} x
 * @param {number} y
 */
export const copyImageAt = (view, x, y) => {
  Assert.number(x)
  Assert.number(y)
  const { webContents } = view
  webContents.copyImageAt(x, y)
}

export const setFallThroughKeyBindings = (fallthroughKeyBindings) => {
  ElectronWebContentsViewState.setFallthroughKeyBindings(fallthroughKeyBindings)
}

// TODO maybe move some of these to webContentFunctions

/**
 * @param {Electron.BrowserView} view
 */
export const getStats = (view) => {
  const { webContents } = view
  const canGoBack = webContents.canGoBack()
  const canGoForward = webContents.canGoForward()
  const url = webContents.getURL()
  const title = webContents.getTitle()
  return {
    canGoBack,
    canGoForward,
    url,
    title,
  }
}
