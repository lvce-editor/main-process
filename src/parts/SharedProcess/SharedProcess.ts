import * as IpcChildType from '../IpcChildType/IpcChildType.ts'
import * as JsonRpc from '../JsonRpc/JsonRpc.ts'
import * as LaunchSharedProcess from '../LaunchSharedProcess/LaunchSharedProcess.ts'
import * as SharedProcessState from '../SharedProcessState/SharedProcessState.js'

export const getOrCreate = async ({ method, env = {} }) => {
  if (!SharedProcessState.state.promise) {
    // @ts-ignore
    SharedProcessState.state.promise = LaunchSharedProcess.launchSharedProcess({ method, env })
  }
  return SharedProcessState.state.promise
}

export const send = async (method, ...params) => {
  const ipc = await getOrCreate({
    method: IpcChildType.ElectronUtilityProcess,
  })
  JsonRpc.send(ipc, method, ...params)
}

export const invoke = async (method, ...params) => {
  const ipc = await getOrCreate({
    method: IpcChildType.ElectronUtilityProcess,
  })
  return JsonRpc.invoke(ipc, method, ...params)
}

export const invokeAndTransfer = async (transfer, method, ...params) => {
  const ipc = await getOrCreate({
    method: IpcChildType.ElectronUtilityProcess,
  })
  return JsonRpc.invokeAndTransfer(ipc, transfer, method, ...params)
}
