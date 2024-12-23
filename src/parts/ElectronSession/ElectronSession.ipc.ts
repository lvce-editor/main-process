import * as ElectronSession from './ElectronSession.ts'

export const name = 'ElectronSession'

export const Commands = {
  registerWebviewProtocol: ElectronSession.registerWebviewProtocol,
}
