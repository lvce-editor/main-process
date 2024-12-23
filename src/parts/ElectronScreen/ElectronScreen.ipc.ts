import * as ElectronScreen from './ElectronScreen.ts'

export const name = 'ElectronScreen'

export const Commands = {
  getBounds: ElectronScreen.getBounds,
  getWidth: ElectronScreen.getWidth,
  getHeight: ElectronScreen.getHeight,
}
