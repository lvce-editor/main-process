import * as ElectronWindow from './ElectronWindow.ts'

export const name = 'ElectronWindow'

export const Commands = {
  executeWindowFunction: ElectronWindow.executeWindowFunction,
  executeWebContentsFunction: ElectronWindow.executeWebContentsFunction,
  getFocusedWindowId: ElectronWindow.getFocusedWindowId,
  getZoom: ElectronWindow.getZoom,
}
