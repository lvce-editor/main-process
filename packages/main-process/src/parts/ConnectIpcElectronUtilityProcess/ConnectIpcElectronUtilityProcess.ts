import * as TransferMessagePortMain from '../TransferMessagePortMain/TransferMessagePortMain.ts'

export const connectIpc = async (rpc, browserWindowPort, ...params) => {
  await TransferMessagePortMain.transferMessagePortMain(rpc, browserWindowPort, ...params)
}
