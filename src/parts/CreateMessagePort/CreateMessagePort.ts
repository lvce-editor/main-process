import * as Assert from '../Assert/Assert.ts'
import * as HandleMessagePortForSharedProcess from '../HandleMessagePortForSharedProcess/HandleMessagePortForSharedProcess.ts'

// TODO reverse order of parameters: make ports first
// TODO when sending transferrables, remove them from parameters
export const createMessagePort = async (ipcId, port, webContentsId): Promise<any> => {
  Assert.number(ipcId)
  Assert.object(port)
  await HandleMessagePortForSharedProcess.handlePort(port, ipcId)
  return webContentsId
}
