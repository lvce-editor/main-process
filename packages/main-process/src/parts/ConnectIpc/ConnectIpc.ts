import * as ConnectIpcElectronUtilityProcess from '../ConnectIpcElectronUtilityProcess/ConnectIpcElectronUtilityProcess.ts'
import * as ConnectIpcNodeWorker from '../ConnectIpcNodeWorker/ConnectIpcNodeWorker.ts'
import * as IpcParentType from '../IpcParentType/IpcParentType.ts'

const getModule = (method: number): any => {
  switch (method) {
    case IpcParentType.NodeWorker:
      return ConnectIpcNodeWorker.connectIpc
    case IpcParentType.ElectronUtilityProcess:
      return ConnectIpcElectronUtilityProcess.connectIpc
    default:
      throw new Error('unexpected ipc type')
  }
}

export const connectIpc = async (method, ipc, browserWindowPort, ipcId): Promise<any> => {
  const connectIpc = getModule(method)
  return connectIpc(ipc, browserWindowPort, ipcId)
}
