import * as ElectronWindowOpenActionType from '../ElectronWindowOpenActionType/ElectronWindowOpenActionType.ts'
import { openExternal } from '../OpenExternal/OpenExternal.ts'
import * as ShouldOpenExternal from '../ShouldOpenExternal/ShouldOpenExternal.ts'

export const key = 'window-open'

export const attach = (webContents, listener) => {
  webContents.setWindowOpenHandler(listener)
}

export const detach = (webContents, listener) => {
  webContents.setWindowOpenHandler(null)
}

export const handler = ({ url }: { disposition: string; url: string }) => {
  if (ShouldOpenExternal.shouldOpenExternal(url)) {
    void openExternal(url)
  }
  return {
    messages: [],
    result: {
      action: ElectronWindowOpenActionType.Deny,
    },
  }
}
