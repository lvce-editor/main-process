import * as Assert from '../Assert/Assert.ts'
import * as HandleIpcSharedProcess from '../HandleIpcMainProcess/HandleIpcMainProcess.ts'
import * as HandleIpcRendererProcess from '../HandleIpcRendererProcess/HandleIpcRendererProcess.js'
import * as HandleIpcUtilityProcess from '../HandleIpcUtilityProcess/HandleIpcUtilityProcess.js'
import * as IpcId from '../IpcId/IpcId.js'

export const getModule = (ipcId) => {
  Assert.number(ipcId)
  switch (ipcId) {
    case IpcId.SharedProcess:
      return HandleIpcSharedProcess
    case IpcId.UtilityProcess:
      return HandleIpcUtilityProcess
    case IpcId.RendererProcess:
      return HandleIpcRendererProcess
    default:
      throw new Error(`unexpected incoming ipc`)
  }
}
