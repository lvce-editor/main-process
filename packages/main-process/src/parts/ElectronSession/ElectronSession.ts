import { ElectronMessagePortRpcClient } from '@lvce-editor/rpc'
import * as Assert from '../Assert/Assert.ts'
import * as CreateElectronSession from '../CreateElectronSession/CreateElectronSession.ts'
import * as ElectronSessionState from '../ElectronSessionState/ElectronSessionState.ts'
import * as Protocol from '../Protocol/Protocol.ts'
import * as RequiresSocket from '../RequiresSocket/RequiresSocket.ts'
import * as Scheme from '../Scheme/Scheme.ts'
import * as WebViewRequestHandler from '../WebViewRequestHandler/WebViewRequestHandler.ts'

export const get = (): globalThis.Electron.Session => {
  if (!ElectronSessionState.has()) {
    ElectronSessionState.set(CreateElectronSession.createElectronSession())
  }
  return ElectronSessionState.get()
}

export const registerWebviewProtocol = async (port) => {
  Assert.object(port)
  const rpc = await ElectronMessagePortRpcClient.create({
    commandMap: {},
    messagePort: port,
    requiresSocket: RequiresSocket.requiresSocket,
  })
  const session = get()
  const handleRequest = WebViewRequestHandler.create(rpc)
  Protocol.handle(session.protocol, Scheme.WebView, handleRequest)
}
