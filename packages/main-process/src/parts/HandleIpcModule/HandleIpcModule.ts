import * as Assert from '../Assert/Assert.ts'
import * as HandleIpcSharedProcess from '../HandleIpcMainProcess/HandleIpcMainProcess.ts'
import * as HandleIpcRendererProcess from '../HandleIpcRendererProcess/HandleIpcRendererProcess.ts'
import * as HandleIpcUtilityProcess from '../HandleIpcUtilityProcess/HandleIpcUtilityProcess.ts'
import * as IpcId from '../IpcId/IpcId.ts'

export const getModule = (ipcId) => {
  Assert.number(ipcId)
  switch (ipcId) {
    case IpcId.RendererProcess:
      return HandleIpcRendererProcess
    case IpcId.SharedProcess:
      return HandleIpcSharedProcess
    case IpcId.UtilityProcess:
      return HandleIpcUtilityProcess
    default:
      throw new Error(`unexpected incoming ipc`)
  }
}
