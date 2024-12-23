import { IpcParentWithNodeForkedProcess, IpcParentWithNodeWorker, IpcParentWithElectronMessagePort } from '@lvce-editor/ipc'
import * as IpcParentType from '../IpcParentType/IpcParentType.ts'

export const getModule = (method) => {
  switch (method) {
    case IpcParentType.NodeWorker:
      return IpcParentWithNodeWorker
    case IpcParentType.NodeForkedProcess:
      return IpcParentWithNodeForkedProcess
    case IpcParentType.ElectronUtilityProcess:
      return import('../IpcParentWithElectronUtilityProcess/IpcParentWithElectronUtilityProcess.ts')
    case IpcParentType.ElectronMessagePort:
      return IpcParentWithElectronMessagePort
    default:
      throw new Error(`unexpected ipc type ${method}`)
  }
}
