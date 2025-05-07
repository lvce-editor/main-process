import * as IpcChildType from '../IpcChildType/IpcChildType.ts'
import * as LaunchSharedProcess2 from '../LaunchSharedProcess2/LaunchSharedProcess2.ts'
import * as SharedProcessState from '../SharedProcessState/SharedProcessState.ts'

export const getOrCreate = async ({ method, env = {} }): Promise<any> => {
  if (!SharedProcessState.state.promise) {
    // @ts-ignore
    SharedProcessState.state.promise = LaunchSharedProcess2.launchSharedProcess2({ method, env })
  }
  return SharedProcessState.state.promise
}

export const send = async (method, ...params) => {
  const rpc = await getOrCreate({
    method: IpcChildType.ElectronUtilityProcess,
  })
  rpc.send(method, ...params)
}

export const invoke = async (method, ...params) => {
  const rpc = await getOrCreate({
    method: IpcChildType.ElectronUtilityProcess,
  })
  return rpc.invoke(method, ...params)
}

export const invokeAndTransfer = async (transfer, method, ...params) => {
  const rpc = await getOrCreate({
    method: IpcChildType.ElectronUtilityProcess,
  })
  return rpc.invokeAndTransfer(transfer, method, ...params)
}
