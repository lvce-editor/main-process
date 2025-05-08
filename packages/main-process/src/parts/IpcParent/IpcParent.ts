import * as IpcParentModule from '../IpcParentModule/IpcParentModule.ts'

/**
 *
 * @param {*} param0
 * @returns {Promise<any>}
 * @deprecated
 */
export const create = async ({ method, ...options }) => {
  const module = await IpcParentModule.getModule(method)
  // @ts-ignore
  const rawIpc = await module.create(options)
  // @ts-ignore
  if (module.effects) {
    // @ts-ignore
    module.effects({
      rawIpc,
      ...options,
    })
  }
  if (options.noReturn) {
    return undefined
  }
  // @ts-ignore
  const ipc = module.wrap(rawIpc)
  return ipc
}
