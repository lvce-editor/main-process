import type { WebContentsView } from 'electron'

interface FindResult {
  readonly activeMatchOrdinal: number
  readonly matches: number
}

const pending = new WeakMap<WebContentsView, () => void>()

export const stop = (view: WebContentsView): void => {
  pending.get(view)?.()
  if (!view.webContents.isDestroyed()) view.webContents.stopFindInPage('clearSelection')
}

export const find = (view: WebContentsView, text: string, forward = true, matchCase = false, newSession = true): Promise<FindResult | undefined> => {
  pending.get(view)?.()
  const { webContents } = view
  if (webContents.isDestroyed()) return Promise.resolve(undefined)
  if (!text) {
    stop(view)
    return Promise.resolve({ activeMatchOrdinal: 0, matches: 0 })
  }
  return new Promise((resolve, reject) => {
    let requestId = 0
    const finish = (result?: FindResult): void => {
      clearTimeout(timeout)
      webContents.off('found-in-page', onResult)
      webContents.off('did-start-navigation', onNavigation)
      webContents.off('destroyed', cancel)
      webContents.off('render-process-gone', cancel)
      pending.delete(view)
      resolve(result)
    }
    const cancel = (): void => finish()
    const onNavigation = (_event: unknown, _url: string, inPlace: boolean, mainFrame: boolean): void => {
      if (mainFrame && !inPlace) cancel()
    }
    const onResult = (_event: unknown, result: Electron.Result): void => {
      if (result.requestId === requestId && result.finalUpdate) {
        finish({ activeMatchOrdinal: result.activeMatchOrdinal, matches: result.matches })
      }
    }
    const timeout = setTimeout(cancel, 10_000)
    pending.set(view, cancel)
    webContents.on('found-in-page', onResult)
    webContents.on('did-start-navigation', onNavigation)
    webContents.once('destroyed', cancel)
    webContents.once('render-process-gone', cancel)
    try {
      // Electron maps findNext to Chromium's new_session option.
      requestId = webContents.findInPage(text, { findNext: newSession, forward, matchCase })
    } catch (error) {
      clearTimeout(timeout)
      webContents.off('found-in-page', onResult)
      webContents.off('did-start-navigation', onNavigation)
      webContents.off('destroyed', cancel)
      webContents.off('render-process-gone', cancel)
      pending.delete(view)
      reject(error)
    }
  })
}
