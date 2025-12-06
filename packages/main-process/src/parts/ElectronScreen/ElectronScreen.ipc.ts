import * as ElectronScreen from './ElectronScreen.ts'

export const name = 'ElectronScreen'

export const Commands = {
  getBounds: ElectronScreen.getBounds,
  getHeight: ElectronScreen.getHeight,
  getWidth: ElectronScreen.getWidth,
}
