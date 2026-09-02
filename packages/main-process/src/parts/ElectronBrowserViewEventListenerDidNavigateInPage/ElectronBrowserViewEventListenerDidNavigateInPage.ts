import * as ElectronWebContentsEventType from '../ElectronWebContentsEventType/ElectronWebContentsEventType.ts'

export const key = ElectronWebContentsEventType.DidNavigateInPage

export const attach = (webContents, listener): void => {
  webContents.on(ElectronWebContentsEventType.DidNavigateInPage, listener)
}

export const detach = (webContents, listener): void => {
  webContents.off(ElectronWebContentsEventType.DidNavigateInPage, listener)
}

export const handler = (_event, url: string, isMainFrame: boolean): any => {
  const messages = isMainFrame ? [['handleDidNavigate', url]] : []
  return {
    messages,
    result: undefined,
  }
}
