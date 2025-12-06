import * as IpcChildType from '../IpcChildType/IpcChildType.ts'
import * as LaunchSharedProcess from '../LaunchSharedProcess/LaunchSharedProcess.ts'
import * as SharedProcessState from '../SharedProcessState/SharedProcessState.ts'

export const getOrCreate = async ({ env = {}, method }): Promise<any> => {
  if (!SharedProcessState.state.promise) {
    // @ts-ignore
    SharedProcessState.state.promise = LaunchSharedProcess.launchSharedProcess({ env, method })
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

export const invokeAndTransfer = async (method, ...params) => {
  const rpc = await getOrCreate({
    method: IpcChildType.ElectronUtilityProcess,
  })
  return rpc.invokeAndTransfer(method, ...params)
}
