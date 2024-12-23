import * as IpcParentType from '../IpcParentType/IpcParentType.ts'

const getModule = (method: number): any => {
  switch (method) {
    case IpcParentType.NodeWorker:
      return import('../ConnectIpcNodeWorker/ConnectIpcNodeWorker.ts')
    case IpcParentType.ElectronUtilityProcess:
      return import('../ConnectIpcElectronUtilityProcess/ConnectIpcElectronUtilityProcess.ts')
    default:
      throw new Error('unexpected ipc type')
  }
}

export const connectIpc = async (method, ipc, browserWindowPort, ipcId): Promise<any> => {
  const module = await getModule(method)
  return module.connectIpc(ipc, browserWindowPort, ipcId)
}
