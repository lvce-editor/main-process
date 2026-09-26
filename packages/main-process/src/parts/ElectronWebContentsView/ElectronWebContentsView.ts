import * as RpcRegistry from '@lvce-editor/rpc-registry'
import * as Electron from 'electron'
import { BrowserWindow, WebContentsView } from 'electron'
import * as Assert from '../Assert/Assert.ts'
import * as BrowserFullWidthGesture from '../BrowserFullWidthGesture/BrowserFullWidthGesture.ts'
import * as DisposeWebContents from '../DisposeWebContents/DisposeWebContents.ts'
import * as ElectronBrowserViewEventListeners from '../ElectronBrowserViewEventListeners/ElectronBrowserViewEventListeners.ts'
import * as ElectronSessionForBrowserView from '../ElectronSessionForBrowserView/ElectronSessionForBrowserView.ts'
import * as ElectronWebContentsViewAuthenticationState from '../ElectronWebContentsViewAuthenticationState/ElectronWebContentsViewAuthenticationState.ts'
import * as ElectronWebContentsViewIpc from '../ElectronWebContentsViewIpc/ElectronWebContentsViewIpc.ts'
import * as ElectronWebContentsViewNavigationFocus from '../ElectronWebContentsViewNavigationFocus/ElectronWebContentsViewNavigationFocus.ts'
import * as ElectronWebContentsViewPerformance from '../ElectronWebContentsViewPerformance/ElectronWebContentsViewPerformance.ts'
import * as ElectronWebContentsViewState from '../ElectronWebContentsViewState/ElectronWebContentsViewState.ts'
import * as HandleElectronMessagePort from '../HandleElectronMessagePort/HandleElectronMessagePort.ts'
import * as WebContentsFocus from '../WebContentsFocus/WebContentsFocus.ts'

const webContentsWithEventListeners = new WeakSet<Electron.WebContents>()

const attachEventListenersToWebContents = (webContentsId, webContents, browserWindow) => {
  if (webContentsWithEventListeners.has(webContents)) {
    return
  }
  WebContentsFocus.attach(webContents)
  BrowserFullWidthGesture.attach(browserWindow, webContents)
  ElectronWebContentsViewNavigationFocus.attach(webContents, browserWindow.webContents)
  ElectronWebContentsViewPerformance.attach(webContents)
  const values = Object.values(ElectronBrowserViewEventListeners)
  for (const value of values) {
    const handleResult = ({ messages, result }) => {
      for (const message of messages) {
        const [key, ...rest] = message
        if (key === 'handleContextMenu') {
          ElectronWebContentsViewIpc.send(webContentsId, `ElectronBrowserView.${key}`, ...rest)
        } else {
          ElectronWebContentsViewIpc.send(webContentsId, `ElectronBrowserView.${key}`, webContentsId, ...rest)
        }
      }
      return result
    }
    const handleAsyncResult = async (handlerResult) => {
      try {
        return handleResult(await handlerResult)
      } catch (error) {
        console.error(error)
      }
    }
    const wrappedListener = (...args) => {
      // @ts-ignore
      const createWindow = (options: Electron.WebContentsViewConstructorOptions, url: string, disposition: string): Electron.WebContents => {
        const connectionId = ElectronWebContentsViewState.getConnectionId(webContentsId)
        const view = createWebContentsViewForWindow(browserWindow, options, connectionId)
        ElectronWebContentsViewIpc.send(
          webContentsId,
          'ElectronBrowserView.handleWindowOpen',
          webContentsId,
          view.webContents.id,
          url,
          disposition,
        )
        // Link-created tabs have no supplied contents or pending navigation, unlike scripted popups.
        if (!options.webContents) {
          void view.webContents.loadURL(url).catch(console.error)
        }
        return view.webContents
      }
      // @ts-ignore Electron event handlers have different argument tuples
      const handlerResult = value.handler(...args, webContentsId, webContents, createWindow)
      if (handlerResult instanceof Promise) {
        return handleAsyncResult(handlerResult)
      }
      return handleResult(handlerResult)
    }
    value.attach(webContents, wrappedListener)
  }
  webContentsWithEventListeners.add(webContents)
}

const createWebContentsViewForWindow = (
  browserWindow: Electron.BrowserWindow,
  options: Electron.WebContentsViewConstructorOptions = {},
  connectionId = undefined,
): Electron.WebContentsView => {
  const view = new WebContentsView({
    // Electron's popup contents carry the opener relationship and pending navigation.
    ...(options.webContents && { webContents: options.webContents }),
    webPreferences: {
      ...options.webPreferences,
      // Tab selection controls focus. A hidden background tab must not steal it
      // when Electron commits its navigation while the view remains attached.
      focusOnNavigation: false,
      session: ElectronSessionForBrowserView.getSession(),
    },
  })
  view.setBounds({ height: 720, width: 1280, x: 0, y: 0 })
  browserWindow.contentView.addChildView(view, 0)
  const { webContents } = view
  ElectronWebContentsViewState.add(webContents.id, browserWindow, view, connectionId)
  attachEventListenersToWebContents(webContents.id, webContents, browserWindow)
  return view
}

export const createWebContentsView = async (restoreId = 0, windowId = 0, connectionId = undefined) => {
  Assert.number(restoreId)
  Assert.number(windowId)
  // Legacy callers omit the owner. A supplied owner must never be replaced by whichever window currently has focus.
  const browserWindow = windowId ? BrowserWindow.fromId(windowId) : BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
  if (!browserWindow || browserWindow.isDestroyed()) {
    throw new Error('Cannot create a browser tab because its window is closed')
  }
  const existing = restoreId ? ElectronWebContentsViewState.get(restoreId) : undefined
  if (existing) {
    if (existing.browserWindow !== browserWindow) {
      throw new Error('Cannot restore a browser tab from another window')
    }
    if (!existing.view.webContents.isDestroyed()) {
      // Keep the native view attached: reattachment must not navigate, resize,
      // change visibility/focus, or interrupt media playback.
      return existing.view.webContents.id
    }
    ElectronWebContentsViewState.remove(restoreId)
  }
  const view = createWebContentsViewForWindow(browserWindow, {}, connectionId)
  return view.webContents.id
}

export const handleMessagePort = async (messagePort, connectionId) => {
  await HandleElectronMessagePort.handleElectronMessagePort(messagePort, connectionId)
  const handleClose = async () => {
    await disposeWebContentsViewsForConnection(connectionId)
    RpcRegistry.remove(connectionId)
  }
  if ('addEventListener' in messagePort) {
    messagePort.addEventListener('close', handleClose, { once: true })
  } else if ('once' in messagePort) {
    messagePort.once('close', handleClose)
  }
}

export const disposeWebContentsViewsForConnection = async (connectionId) => {
  const ids = ElectronWebContentsViewState.getIdsByConnectionId(connectionId)
  for (const id of ids) {
    disposeWebContentsView(id)
  }
}

export const attachEventListeners = (webContentsId) => {
  Assert.number(webContentsId)
  const webContents = Electron.webContents.fromId(webContentsId)
  const state = ElectronWebContentsViewState.get(webContentsId)
  if (!webContents || !state) {
    return
  }
  attachEventListenersToWebContents(webContentsId, webContents, state.browserWindow)
}

export const disposeWebContentsView = (browserViewId) => {
  console.log('[main process] dispose browser view', browserViewId)
  ElectronWebContentsViewAuthenticationState.cancelForWebContents(browserViewId)
  const instance = ElectronWebContentsViewState.get(browserViewId)
  if (!instance) {
    return
  }
  const { browserWindow, view } = instance
  ElectronWebContentsViewState.remove(browserViewId)
  if (!browserWindow.isDestroyed()) {
    browserWindow.contentView.removeChildView(view)
  }
  if (!view.webContents.isDestroyed()) {
    DisposeWebContents.disposeWebContents(view.webContents)
  }
}
