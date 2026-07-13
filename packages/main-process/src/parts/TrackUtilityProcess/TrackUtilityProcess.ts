import * as FormatUtilityProcessName from '../FormatUtilityProcessName/FormatUtilityProcessName.ts'
import * as UtilityProcessState from '../UtilityProcessState/UtilityProcessState.ts'

export const trackUtilityProcess = (rawIpc: any, name: string): void => {
  if (!rawIpc?.pid) {
    return
  }
  const { pid } = rawIpc
  const formattedName = FormatUtilityProcessName.formatUtilityProcessName(name)
  UtilityProcessState.add(pid, rawIpc, formattedName)
  const cleanup = (): void => {
    UtilityProcessState.remove(pid)
    rawIpc.off('exit', handleExit)
  }
  const handleExit = (): void => {
    cleanup()
  }
  rawIpc.on('exit', handleExit)
}
