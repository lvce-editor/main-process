import * as Electron from 'electron'
import { BrowserWindow, WebContentsView } from 'electron'
import * as Assert from '../Assert/Assert.ts'
import * as ElectronBrowserViewEventListeners from '../ElectronBrowserViewEventListeners/ElectronBrowserViewEventListeners.ts'
import * as ElectronSessionForBrowserView from '../ElectronSessionForBrowserView/ElectronSessionForBrowserView.ts'
import * as ElectronWebContentsViewState from '../ElectronWebContentsViewState/ElectronWebContentsViewState.ts'
import * as EmbedsProcess from '../EmbedsProcess/EmbedsProcess.ts'

// TODO use electron 30 webcontentsview api
export const createWebContentsView = async () => {
  const view = new WebContentsView({
    webPreferences: {
      session: ElectronSessionForBrowserView.getSession(),
    },
  })
  // TODO get browser window id from renderer worker
  const browserWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
  const { webContents } = view
  const { id } = webContents
  ElectronWebContentsViewState.add(id, browserWindow, view)
  return id
}

export const attachEventListeners = (webContentsId) => {
  Assert.number(webContentsId)
  const webContents = Electron.webContents.fromId(webContentsId)
  if (!webContents) {
    return
  }
  const values = Object.values(ElectronBrowserViewEventListeners)
  for (const value of values) {
    const wrappedListener = (...args) => {
      // @ts-ignore
      const { messages, result } = value.handler(...args)
      for (const message of messages) {
        const [key, ...rest] = message
        EmbedsProcess.send(`ElectronWebContents.${key}`, webContentsId, ...rest)
      }
      return result
    }
    // TODO detached listeners when webcontents are disposed
    // to avoid potential memory leaks
    value.attach(webContents, wrappedListener)
  }
}

export const disposeWebContentsView = (browserViewId) => {
  console.log('[main process] dispose browser view', browserViewId)
  const instance = ElectronWebContentsViewState.get(browserViewId)
  if (!instance) {
    return
  }
  const { browserWindow, view } = instance
  ElectronWebContentsViewState.remove(browserViewId)
  browserWindow.contentView.removeChildView(view)
}
