import { VError } from '../VError/VError.ts'

export const transferMessagePort = async (rpc, port, ...params) => {
  try {
    await rpc.invokeAndTransfer('HandleNodeMessagePort.handleNodeMessagePort', port, ...params)
  } catch (error) {
    throw new VError(error, `Failed to send message port to worker thread`)
  }
}
