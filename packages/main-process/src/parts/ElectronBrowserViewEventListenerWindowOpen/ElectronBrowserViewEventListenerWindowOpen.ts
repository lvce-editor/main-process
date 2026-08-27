import * as ElectronWindowOpenActionType from '../ElectronWindowOpenActionType/ElectronWindowOpenActionType.ts'
import * as ShouldOpenExternal from '../ShouldOpenExternal/ShouldOpenExternal.ts'

export const key = 'window-open'

export const attach = (webContents, listener) => {
  webContents.setWindowOpenHandler(listener)
}

export const detach = (webContents, listener) => {
  webContents.setWindowOpenHandler(null)
}

export const handler = ({ disposition, url }: { disposition: string; url: string }) => {
  const messages = ShouldOpenExternal.shouldOpenExternal(url) ? [['handleWindowOpen', url, disposition]] : []
  return {
    messages,
    result: {
      action: ElectronWindowOpenActionType.Deny,
    },
  }
}
