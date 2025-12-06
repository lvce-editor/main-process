import * as ElectronWebContents from './ElectronWebContents.ts'

export const name = 'ElectronWebContents'

export const Commands = {
  callFunction: ElectronWebContents.callFunction,
  dispose: ElectronWebContents.dispose,
  getStats: ElectronWebContents.getStats,
}
