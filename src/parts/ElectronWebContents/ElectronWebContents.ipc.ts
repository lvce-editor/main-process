import * as ElectronWebContents from './ElectronWebContents.ts'

export const name = 'ElectronWebContents'

export const Commands = {
  dispose: ElectronWebContents.dispose,
  getStats: ElectronWebContents.getStats,
  callFunction: ElectronWebContents.callFunction,
}
