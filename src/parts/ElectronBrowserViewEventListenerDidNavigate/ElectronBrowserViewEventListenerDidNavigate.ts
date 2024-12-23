import * as ElectronWebContentsEventType from '../ElectronWebContentsEventType/ElectronWebContentsEventType.ts'

export const key = 'did-navigate'

export const attach = (webContents, listener) => {
  webContents.on(ElectronWebContentsEventType.DidNavigate, listener)
}

export const detach = (webContents, listener) => {
  webContents.off(ElectronWebContentsEventType.DidNavigate, listener)
}

export const handler = (event, url) => {
  return {
    result: undefined,
    messages: [['handleDidNavigate', url]],
  }
}
