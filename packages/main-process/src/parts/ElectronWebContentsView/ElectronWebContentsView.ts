import * as Electron from 'electron'
import { BrowserWindow, WebContentsView } from 'electron'
import * as Assert from '../Assert/Assert.ts'
import * as DisposeWebContents from '../DisposeWebContents/DisposeWebContents.ts'
import * as ElectronBrowserViewEventListeners from '../ElectronBrowserViewEventListeners/ElectronBrowserViewEventListeners.ts'
import * as ElectronSessionForBrowserView from '../ElectronSessionForBrowserView/ElectronSessionForBrowserView.ts'
import * as ElectronWebContentsViewAuthenticationState from '../ElectronWebContentsViewAuthenticationState/ElectronWebContentsViewAuthenticationState.ts'
import * as ElectronWebContentsViewNavigationFocus from '../ElectronWebContentsViewNavigationFocus/ElectronWebContentsViewNavigationFocus.ts'
import * as ElectronWebContentsViewPerformance from '../ElectronWebContentsViewPerformance/ElectronWebContentsViewPerformance.ts'
import * as ElectronWebContentsViewState from '../ElectronWebContentsViewState/ElectronWebContentsViewState.ts'
import * as EmbedsProcess from '../EmbedsProcess/EmbedsProcess.ts'

const webContentsWithEventListeners = new WeakSet<Electron.WebContents>()

const attachEventListenersToWebContents = (webContentsId, webContents, browserWindow) => {
  if (webContentsWithEventListeners.has(webContents)) {
    return
  }
  ElectronWebContentsViewNavigationFocus.attach(webContents, browserWindow.webContents)
  ElectronWebContentsViewPerformance.attach(webContents)
  const values = Object.values(ElectronBrowserViewEventListeners)
  for (const value of values) {
    const wrappedListener = (...args) => {
      // @ts-ignore
      const { messages, result } = value.handler(...args, webContentsId)
      for (const message of messages) {
        const [key, ...rest] = message
        EmbedsProcess.send(`ElectronWebContents.${key}`, webContentsId, ...rest)
      }
      return result
    }
    value.attach(webContents, wrappedListener)
  }
  webContentsWithEventListeners.add(webContents)
}

// TODO use electron 30 webcontentsview api
export const createWebContentsView = async () => {
  const view = new WebContentsView({
    webPreferences: {
      session: ElectronSessionForBrowserView.getSession(),
    },
  })
  // TODO get browser window id from renderer worker
  const browserWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
  view.setBounds({ height: 720, width: 1280, x: 0, y: 0 })
  browserWindow.contentView.addChildView(view, 0)
  const { webContents } = view
  const { id } = webContents
  ElectronWebContentsViewState.add(id, browserWindow, view)
  attachEventListenersToWebContents(id, webContents, browserWindow)
  return id
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
  browserWindow.contentView.removeChildView(view)
  DisposeWebContents.disposeWebContents(view.webContents)
}
