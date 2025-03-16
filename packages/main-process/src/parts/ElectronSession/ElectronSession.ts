import * as Assert from '../Assert/Assert.ts'
import * as CreateElectronSession from '../CreateElectronSession/CreateElectronSession.ts'
import * as ElectronSessionState from '../ElectronSessionState/ElectronSessionState.ts'
import * as HandleIpc from '../HandleIpc/HandleIpc.ts'
import * as IpcParent from '../IpcParent/IpcParent.ts'
import * as IpcParentType from '../IpcParentType/IpcParentType.ts'
import * as Protocol from '../Protocol/Protocol.ts'
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
  console.log('will register ptorocol')
  const ipc = await IpcParent.create({
    method: IpcParentType.ElectronMessagePort,
    messagePort: port,
  })
  console.log('do register protocol')
  HandleIpc.handleIpc(ipc)
  port.start()
  const session = get()
  const handleRequest = WebViewRequestHandler.create(ipc)
  // @ts-ignore
  Protocol.handle(session.protocol, Scheme.WebView, handleRequest)
}
