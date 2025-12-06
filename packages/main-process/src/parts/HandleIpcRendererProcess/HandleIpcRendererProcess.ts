import * as Assert from '../Assert/Assert.ts'
import * as IpcChild from '../IpcChild/IpcChild.ts'
import * as IpcChildType from '../IpcChildType/IpcChildType.ts'

export const targetMessagePort = async (messagePort, message) => {
  Assert.object(messagePort)
  const ipc = await IpcChild.listen({
    messagePort,
    method: IpcChildType.ElectronMessagePort,
  })
  return ipc
}

export const upgradeMessagePort = () => {
  return {
    type: 'handle',
  }
}
