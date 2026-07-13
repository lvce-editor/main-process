import { ElectronUtilityProcessRpcParent } from '@lvce-editor/rpc'
import * as TrackUtilityProcess from '../TrackUtilityProcess/TrackUtilityProcess.ts'

interface RpcWithRawIpc {
  readonly ipc?: {
    readonly _rawIpc?: unknown
  }
}

export const createElectronUtilityProcessRpc = async (options: any): Promise<any> => {
  const rpc = await ElectronUtilityProcessRpcParent.create(options)
  const rpcWithRawIpc = rpc as RpcWithRawIpc
  TrackUtilityProcess.trackUtilityProcess(rpcWithRawIpc.ipc?._rawIpc, options.name)
  return rpc
}
