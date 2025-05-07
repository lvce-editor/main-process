import { VError } from '../VError/VError.ts'

export const transferMessagePortMain = async (rpc, port, ...params) => {
  try {
    await rpc.invokeAndTransfer('HandleElectronMessagePort.handleElectronMessagePort', port, ...params)
  } catch (error) {
    throw new VError(error, `Failed to send message port to utility process`)
  }
}
