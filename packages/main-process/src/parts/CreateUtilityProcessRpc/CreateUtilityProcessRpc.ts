import * as RpcRegistry from '@lvce-editor/rpc-registry'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.ts'
import * as CreateElectronUtilityProcessRpc from '../CreateElectronUtilityProcessRpc/CreateElectronUtilityProcessRpc.ts'

export const createUtilityProcessRpc = async (options) => {
  const rpc = await CreateElectronUtilityProcessRpc.createElectronUtilityProcessRpc({
    commandMap: CommandMapRef.commandMapRef,
    ...options,
  })

  const rpcId = options.targetRpcId || options.rpcId || options.ipcId
  RpcRegistry.set(rpcId, rpc)
}
