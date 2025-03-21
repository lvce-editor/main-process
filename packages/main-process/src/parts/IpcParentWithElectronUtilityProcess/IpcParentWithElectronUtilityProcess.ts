import { IpcParentWithElectronUtilityProcess } from '@lvce-editor/ipc'
import * as FormatUtilityProcessName from '../FormatUtilityProcessName/FormatUtilityProcessName.ts'
import * as UtilityProcessState from '../UtilityProcessState/UtilityProcessState.ts'

export const { create } = IpcParentWithElectronUtilityProcess

export const { wrap } = IpcParentWithElectronUtilityProcess

export const effects = ({ rawIpc, name }) => {
  if (!rawIpc.pid) {
    return
  }
  const { pid } = rawIpc
  const formattedName = FormatUtilityProcessName.formatUtilityProcessName(name)
  UtilityProcessState.add(pid, rawIpc, formattedName)
  const cleanup = () => {
    UtilityProcessState.remove(pid)
    rawIpc.off('exit', handleExit)
  }
  const handleExit = () => {
    cleanup()
  }
  rawIpc.on('exit', handleExit)
}
