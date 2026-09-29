import * as RpcRegistry from '@lvce-editor/rpc-registry'
import * as ElectronWebContentsViewState from '../ElectronWebContentsViewState/ElectronWebContentsViewState.ts'

export const send = (webContentsId: number, method: string, ...params: readonly any[]): void => {
  const connectionId = ElectronWebContentsViewState.getConnectionId(webContentsId)
  if (connectionId === undefined) {
    return
  }
  const rpc = RpcRegistry.get(connectionId)
  if (!rpc) {
    return
  }
  rpc.send(method, ...params)
}
