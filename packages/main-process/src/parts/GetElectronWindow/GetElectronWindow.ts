import * as ElectronWindow from '../ElectronWindow/ElectronWindow.ts'

export const getElectronWindow = (windowId) => {
  if (windowId === -1) {
    return ElectronWindow.getFocusedWindow()
  }
  return ElectronWindow.findById(windowId)
}
