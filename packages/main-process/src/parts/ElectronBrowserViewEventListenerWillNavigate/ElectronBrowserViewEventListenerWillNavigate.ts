import * as ElectronWebContentsEventType from '../ElectronWebContentsEventType/ElectronWebContentsEventType.ts'

export const key = 'will-navigate'

export const attach = (webContents, listener) => {
  webContents.on(ElectronWebContentsEventType.WillNavigate, listener)
}

export const detach = (webContents, listener) => {
  webContents.off(ElectronWebContentsEventType.WillNavigate, listener)
}

export const handler = (event, url) => {
  return {
    messages: [['handleWillNavigate', url]],
    result: undefined,
  }
}
