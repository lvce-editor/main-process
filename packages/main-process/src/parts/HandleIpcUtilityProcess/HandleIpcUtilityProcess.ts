import * as Assert from '../Assert/Assert.ts'
import * as FormatUtilityProcessName from '../FormatUtilityProcessName/FormatUtilityProcessName.ts'
import * as IpcParentWithElectronUtilityProcess from '../IpcParentWithElectronUtilityProcess/IpcParentWithElectronUtilityProcess.ts'
import * as UtilityProcessState from '../UtilityProcessState/UtilityProcessState.ts'

export const targetMessagePort = async (messagePort, message) => {
  Assert.object(messagePort)
  Assert.string(message.name)
  const formattedName = FormatUtilityProcessName.formatUtilityProcessName(message.name)
  const utilityProcess = UtilityProcessState.getByName(formattedName)
  const utilityProcessIpc = IpcParentWithElectronUtilityProcess.wrap(utilityProcess)
  return utilityProcessIpc
}

export const upgradeMessagePort = (port) => {
  return {
    type: 'send',
    method: 'HandleElectronMessagePort.handleElectronMessagePort',
    params: [port],
  }
}
