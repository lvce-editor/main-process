import * as Assert from '../Assert/Assert.ts'
import * as EmbedsProcess from '../EmbedsProcess/EmbedsProcess.ts'
import * as HandleIpc from '../HandleIpc/HandleIpc.ts'
import * as IpcChild from '../IpcChild/IpcChild.ts'
import * as IpcChildType from '../IpcChildType/IpcChildType.ts'
import * as IpcId from '../IpcId/IpcId.ts'

export const handleElectronMessagePort = async (messagePort, ipcId) => {
  Assert.object(messagePort)
  const ipc = await IpcChild.listen({
    method: IpcChildType.ElectronMessagePort,
    messagePort,
  })
  HandleIpc.handleIpc(ipc)
  if (ipcId === IpcId.EmbedsProcess) {
    EmbedsProcess.set(ipc)
  }
}
