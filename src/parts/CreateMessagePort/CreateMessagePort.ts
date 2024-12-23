import * as Assert from '../Assert/Assert.ts'
import * as HandleMessagePortForSharedProcess from '../HandleMessagePortForSharedProcess/HandleMessagePortForSharedProcess.js'

// TODO reverse order of parameters: make ports first
// TODO when sending transferrables, remove them from parameters
<<<<<<< HEAD
export const createMessagePort = async (ipcId, port, webContentsId): Promise<any> => {
=======
export const createMessagePort = async (ipcId, port, webContentsId): any => {
>>>>>>> d6c3761f089d (feature: use explicit return types)
  Assert.number(ipcId)
  Assert.object(port)
  await HandleMessagePortForSharedProcess.handlePort(port, ipcId)
  return webContentsId
}
