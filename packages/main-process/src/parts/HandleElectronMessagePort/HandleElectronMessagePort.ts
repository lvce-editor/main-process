import { ElectronMessagePortRpcClient } from '@lvce-editor/rpc'
import * as RpcRegistry from '@lvce-editor/rpc-registry'
import * as Assert from '../Assert/Assert.ts'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.ts'
import * as IpcId from '../IpcId/IpcId.ts'
import * as RequiresSocket from '../RequiresSocket/RequiresSocket.ts'

export const handleElectronMessagePort = async (messagePort, rpcId) => {
  Assert.object(messagePort)
  const rpc = await ElectronMessagePortRpcClient.create({
    messagePort: messagePort,
    commandMap: CommandMapRef.commandMapRef,
    requiresSocket: RequiresSocket.requiresSocket,
  })
  RpcRegistry.set(IpcId.EmbedsProcess, rpc)
}
