import { IpcParentWithNodeForkedProcess, IpcParentWithNodeWorker, IpcParentWithElectronMessagePort } from '@lvce-editor/ipc'
import * as IpcParentType from '../IpcParentType/IpcParentType.ts'

export const getModule = (method) => {
  switch (method) {
    case IpcParentType.ElectronMessagePort:
      return IpcParentWithElectronMessagePort
    case IpcParentType.ElectronUtilityProcess:
      return import('../IpcParentWithElectronUtilityProcess/IpcParentWithElectronUtilityProcess.ts')
    case IpcParentType.NodeForkedProcess:
      return IpcParentWithNodeForkedProcess
    case IpcParentType.NodeWorker:
      return IpcParentWithNodeWorker
    default:
      throw new Error(`unexpected ipc type ${method}`)
  }
}
