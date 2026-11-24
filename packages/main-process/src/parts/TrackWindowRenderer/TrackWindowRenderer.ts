import type { WebContents } from 'electron'

export const trackWindowRenderer = (webContents: WebContents, preload: string | undefined): (() => boolean) => {
  let preloadFailed = false
  webContents.on('preload-error', (_event, path) => {
    if (path === preload) {
      preloadFailed = true
    }
  })
  webContents.on('did-start-navigation', (_event, _url, isInPlace, isMainFrame) => {
    if (isMainFrame && !isInPlace) {
      preloadFailed = false
    }
  })
  return () => !preloadFailed && !webContents.isCrashed()
}
