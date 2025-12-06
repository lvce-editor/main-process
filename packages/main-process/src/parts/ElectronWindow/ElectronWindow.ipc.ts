import * as ElectronWindow from './ElectronWindow.ts'

export const name = 'ElectronWindow'

export const Commands = {
  executeWebContentsFunction: ElectronWindow.executeWebContentsFunction,
  executeWindowFunction: ElectronWindow.executeWindowFunction,
  getFocusedWindowId: ElectronWindow.getFocusedWindowId,
  getZoom: ElectronWindow.getZoom,
}
