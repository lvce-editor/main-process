import * as ElectronWebContentsEventType from '../ElectronWebContentsEventType/ElectronWebContentsEventType.ts'
import * as ElectronWebContentsViewAuthenticationState from '../ElectronWebContentsViewAuthenticationState/ElectronWebContentsViewAuthenticationState.ts'
import * as ElectronWebContentsViewState from '../ElectronWebContentsViewState/ElectronWebContentsViewState.ts'

export const key = 'destroyed'

export const attach = (webContents, listener) => {
  webContents.on(ElectronWebContentsEventType.Destroyed, listener)
}

export const detach = (webContents, listener) => {
  webContents.off(ElectronWebContentsEventType.Destroyed, listener)
}

export const handler = (_event, webContentsId) => {
  ElectronWebContentsViewAuthenticationState.cancelForWebContents(webContentsId)
  const instance = ElectronWebContentsViewState.get(webContentsId)
  const messages = instance ? [['handleBrowserViewDestroyed']] : []
  if (instance) {
    const { browserWindow, view } = instance
    ElectronWebContentsViewState.remove(webContentsId)
    if (!browserWindow.isDestroyed()) {
      browserWindow.contentView.removeChildView(view)
    }
  }
  return {
    messages,
    result: undefined,
  }
}
