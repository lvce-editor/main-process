import * as RpcRegistry from '@lvce-editor/rpc-registry'
import * as IpcId from '../IpcId/IpcId.ts'

export const invoke = (method, ...params) => {
  const rpc = RpcRegistry.get(IpcId.EmbedsProcess)
  if (!rpc) {
    return
  }
  return rpc.invoke(method, ...params)
}

export const send = (method, ...params) => {
  const rpc = RpcRegistry.get(IpcId.EmbedsProcess)
  if (!rpc) {
    return
  }
  return rpc.send(method, ...params)
}
