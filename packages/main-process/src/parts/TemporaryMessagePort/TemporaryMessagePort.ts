import * as RpcRegistry from '@lvce-editor/rpc-registry'
import * as Assert from '../Assert/Assert.ts'
import * as FormatUtilityProcessName from '../FormatUtilityProcessName/FormatUtilityProcessName.ts'
import * as GetPortTuple from '../GetPortTuple/GetPortTuple.ts'
import * as HandleIpc from '../HandleIpc/HandleIpc.ts'
import * as IpcParentWithElectronUtilityProcess from '../IpcParentWithElectronUtilityProcess/IpcParentWithElectronUtilityProcess.ts'
import * as JsonRpc from '../JsonRpc/JsonRpc.ts'
import * as SharedProcess from '../SharedProcess/SharedProcess.ts'
import * as UtilityProcessState from '../UtilityProcessState/UtilityProcessState.ts'

// TODO
// In order to create utility process from shared process
// create a message channel in the main process and
// send one port to the shared process and the other port
// to the utilityprocess that should be created.
// Then send the other message port that has been sent from renderer worker
// to renderer process to shared process onto the message port
// that was created in the main process to the new utility process
// The message ports in main process only exist temporarily
// because they are sent to the shared process/utility process

export const createPortTuple = async (id1, id2) => {
  Assert.number(id1)
  Assert.number(id2)
  const { port1, port2 } = GetPortTuple.getPortTuple()
  await SharedProcess.invokeAndTransfer('TemporaryMessagePort.handlePorts', port1, port2, id1, id2)
}

/**
 * @deprecated
 */
export const sendTo = async (port, name, ipcId) => {
  Assert.string(name)
  Assert.object(port)
  const formattedName = FormatUtilityProcessName.formatUtilityProcessName(name)
  const utilityProcess = UtilityProcessState.getByName(formattedName)

  const utilityProcessIpc = IpcParentWithElectronUtilityProcess.wrap(utilityProcess)
  HandleIpc.handleIpc(utilityProcessIpc)
  await JsonRpc.invokeAndTransfer(utilityProcessIpc, 'HandleElectronMessagePort.handleElectronMessagePort', port, ipcId)
  HandleIpc.unhandleIpc(utilityProcessIpc)
}

// TODO use rpc id, and then use rpc.invokeAndtransfer
export const sendTo2 = async (port, rpcId) => {
  Assert.object(port)
  const rpc = RpcRegistry.get(rpcId)
  await rpc.invokeAndTransfer('HandleElectronMessagePort.handleElectronMessagePort', port, rpcId)
}

// todo dispose the rpc by rpc id
export const dispose = (name) => {
  Assert.string(name)
  const formattedName = FormatUtilityProcessName.formatUtilityProcessName(name)
  const utilityProcess = UtilityProcessState.getByName(formattedName)
  if (!utilityProcess) {
    return
  }
  utilityProcess.kill()
}
