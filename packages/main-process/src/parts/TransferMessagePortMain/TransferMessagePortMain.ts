import * as JsonRpc from '../JsonRpc/JsonRpc.ts'
import { VError } from '../VError/VError.ts'

export const transferMessagePortMain = async (ipc, port, ...params) => {
  try {
    await JsonRpc.invokeAndTransfer(ipc, 'HandleElectronMessagePort.handleElectronMessagePort', port, ...params)
  } catch (error) {
    throw new VError(error, `Failed to send message port to utility process`)
  }
}
