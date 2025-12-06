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

export const handler = ({ disposition, features, frameName, postBody, referrer, url }) => {
  if (url === 'about:blank') {
    return {
      messages: [],
      result: {
        action: ElectronWindowOpenActionType.Allow,
      },
    }
  }
  if (disposition === ElectronDispositionType.BackgroundTab) {
    return {
      messages: [['handleWindowOpen', url]],
      result: {
        action: ElectronWindowOpenActionType.Deny,
      },
    }
  }
  if (disposition === ElectronDispositionType.NewWindow) {
    return {
      messages: [],
      result: {
        action: ElectronWindowOpenActionType.Allow,
      },
    }
  }
  Logger.info(`[main-process] blocked popup for ${url}`)
  return {
    messages: [],
    result: {
      action: ElectronWindowOpenActionType.Deny,
    },
  }
}
