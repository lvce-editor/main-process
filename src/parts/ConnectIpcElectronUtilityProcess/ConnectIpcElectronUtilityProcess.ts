import * as TransferMessagePortMain from '../TransferMessagePortMain/TransferMessagePortMain.ts'

export const connectIpc = async (ipc, browserWindowPort, ...params) => {
  await TransferMessagePortMain.transferMessagePortMain(ipc, browserWindowPort, ...params)
}
