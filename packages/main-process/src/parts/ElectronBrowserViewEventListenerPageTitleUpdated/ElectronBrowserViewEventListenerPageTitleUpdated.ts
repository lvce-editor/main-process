import * as ElectronWebContentsEventType from '../ElectronWebContentsEventType/ElectronWebContentsEventType.ts'

export const key = 'page-title-updated'

export const attach = (webContents, listener) => {
  webContents.on(ElectronWebContentsEventType.PageTitleUpdated, listener)
}
export const detach = (webContents, listener) => {
  webContents.off(ElectronWebContentsEventType.PageTitleUpdated, listener)
}

export const handler = (event, title) => {
  return {
    result: undefined,
    messages: [['handleTitleUpdated', title]],
  }
}
