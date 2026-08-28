import * as ElectronWebContentsEventType from '../ElectronWebContentsEventType/ElectronWebContentsEventType.ts'

export const key = ElectronWebContentsEventType.AudioStateChanged

export const attach = (webContents, listener): void => {
  webContents.on(ElectronWebContentsEventType.AudioStateChanged, listener)
}

export const detach = (webContents, listener): void => {
  webContents.off(ElectronWebContentsEventType.AudioStateChanged, listener)
}

export const handler = (event): any => {
  return {
    messages: [['handleAudioStateChanged', event.audible]],
    result: undefined,
  }
}
