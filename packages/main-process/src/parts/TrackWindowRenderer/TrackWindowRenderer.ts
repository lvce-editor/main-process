import type { WebContents } from 'electron'
import * as IpcId from '../IpcId/IpcId.ts'

export const trackWindowRenderer = (webContents: WebContents, preload: string | undefined): (() => boolean) => {
  let rendererConnected = false
  let preloadFailed = false

  // The window can be visible before the renderer installs its RPC listener.
  webContents.ipc.on('port', (event, message) => {
    if (
      event.senderFrame === webContents.mainFrame &&
      message?.method === 'CreateMessagePort.createMessagePort' &&
      message.params?.[0] === IpcId.RendererWorker
    ) {
      rendererConnected = true
    }
  })
  webContents.on('did-frame-navigate', (_event, _url, _statusCode, _statusText, isMainFrame) => {
    if (isMainFrame) {
      rendererConnected = false
    }
  })
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
  webContents.on('render-process-gone', () => {
    rendererConnected = false
  })
  return () => rendererConnected && !preloadFailed && !webContents.isCrashed()
}
