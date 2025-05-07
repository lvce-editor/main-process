import { ElectronUtilityProcessRpcParent } from '@lvce-editor/rpc'
import * as RpcRegistry from '@lvce-editor/rpc-registry'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.ts'

export const createUtilityProcessRpc = async (options) => {
  const rpc = await ElectronUtilityProcessRpcParent.create({
    commandMap: CommandMapRef.commandMapRef,
    ...options,
  })
  RpcRegistry.set(options.rpcId, rpc)
}
