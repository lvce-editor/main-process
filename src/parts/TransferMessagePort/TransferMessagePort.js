import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import { VError } from '../VError/VError.js'

export const transferMessagePort = async (ipc, port, ...params) => {
  try {
    await JsonRpc.invokeAndTransfer(ipc, 'HandleNodeMessagePort.handleNodeMessagePort', port, ...params)
  } catch (error) {
    throw new VError(error, `Failed to send message port to worker thread`)
  }
}
