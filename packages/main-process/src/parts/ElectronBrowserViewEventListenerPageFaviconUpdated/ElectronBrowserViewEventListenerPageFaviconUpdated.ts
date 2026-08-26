import * as ElectronWebContentsEventType from '../ElectronWebContentsEventType/ElectronWebContentsEventType.ts'

export const key = ElectronWebContentsEventType.PageFaviconUpdated

export const attach = (webContents, listener): void => {
  webContents.on(ElectronWebContentsEventType.PageFaviconUpdated, listener)
}

export const detach = (webContents, listener): void => {
  webContents.off(ElectronWebContentsEventType.PageFaviconUpdated, listener)
}

export const handler = (event, favicons: readonly string[]): any => {
  return {
    messages: [['handlePageFaviconUpdated', favicons]],
    result: undefined,
  }
}
