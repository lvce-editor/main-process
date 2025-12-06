import * as ConnectIpcElectronUtilityProcess from '../ConnectIpcElectronUtilityProcess/ConnectIpcElectronUtilityProcess.ts'
import * as ConnectIpcNodeWorker from '../ConnectIpcNodeWorker/ConnectIpcNodeWorker.ts'
import * as IpcParentType from '../IpcParentType/IpcParentType.ts'

const getModule = (method: number): any => {
  switch (method) {
    case IpcParentType.ElectronUtilityProcess:
      return ConnectIpcElectronUtilityProcess.connectIpc
    case IpcParentType.NodeWorker:
      return ConnectIpcNodeWorker.connectIpc
    default:
      throw new Error('unexpected ipc type')
  }
}

export const connectIpc = async (method, rpc, browserWindowPort, ipcId): Promise<any> => {
  const connectIpc = getModule(method)
  return connectIpc(rpc, browserWindowPort, ipcId)
}
