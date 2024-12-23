import * as ElectronDispositionType from '../ElectronDispositionType/ElectronDispositionType.ts'
import * as ElectronWindowOpenActionType from '../ElectronWindowOpenActionType/ElectronWindowOpenActionType.ts'
import * as Logger from '../Logger/Logger.ts'

export const key = 'window-open'

export const attach = (webContents, listener) => {
  webContents.setWindowOpenHandler(listener)
}

export const detach = (webContents, listener) => {
  webContents.setWindowOpenHandler(null)
}

export const handler = ({ url, disposition, features, frameName, referrer, postBody }) => {
  if (url === 'about:blank') {
    return {
      result: {
        action: ElectronWindowOpenActionType.Allow,
      },
      messages: [],
    }
  }
  if (disposition === ElectronDispositionType.BackgroundTab) {
    return {
      result: {
        action: ElectronWindowOpenActionType.Deny,
      },
      messages: [['handleWindowOpen', url]],
    }
  }
  if (disposition === ElectronDispositionType.NewWindow) {
    return {
      result: {
        action: ElectronWindowOpenActionType.Allow,
      },
      messages: [],
    }
  }
  Logger.info(`[main-process] blocked popup for ${url}`)
  return {
    result: {
      action: ElectronWindowOpenActionType.Deny,
    },
    messages: [],
  }
}
