import * as ElectronPreloadChannelType from '../ElectronPreloadChannelType/ElectronPreloadChannelType.ts'

export const createWebContentsIpc = (webContents) => {
  return {
    isDisposed() {
      return this.webContents.isDestroyed()
    },
    send(message) {
      this.webContents.postMessage(ElectronPreloadChannelType.Port, message)
    },
    sendAndTransfer(message, transfer) {
      this.webContents.postMessage(ElectronPreloadChannelType.Port, message, transfer)
    },
    webContents,
  }
}
