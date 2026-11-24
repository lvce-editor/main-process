import { ElectronUtilityProcessRpcParent } from '@lvce-editor/rpc'
import * as StartupCpuProfile from '../StartupCpuProfile/StartupCpuProfile.ts'
import * as TrackUtilityProcess from '../TrackUtilityProcess/TrackUtilityProcess.ts'

interface RpcWithRawIpc {
  readonly ipc?: {
    readonly _rawIpc?: unknown
  }
}

export const createElectronUtilityProcessRpc = async (options: any): Promise<any> => {
  const rpc = await StartupCpuProfile.createUtility(options, (profileOptions) => ElectronUtilityProcessRpcParent.create(profileOptions))
  const rpcWithRawIpc = rpc as RpcWithRawIpc
  TrackUtilityProcess.trackUtilityProcess(rpcWithRawIpc.ipc?._rawIpc, options.name)
  return rpc
}
