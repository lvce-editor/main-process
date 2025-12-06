import * as ConnectIpc from '../ConnectIpc/ConnectIpc.ts'
import * as IpcParentType from '../IpcParentType/IpcParentType.ts'
import * as SharedProcess from '../SharedProcess/SharedProcess.ts'

// TODO maybe handle critical (first render) request via ipcMain
// and spawn shared process when page is idle/loaded
// currently launching shared process takes 170ms
// which means first paint is delayed by a lot

// map windows to folders and ports
// const windowConfigMap = new Map()

// TODO when shared process is a utility process
// can just send browserWindowPort to shared process
// else need proxy events through this process

export const handlePort = async (browserWindowPort, ipcId) => {
  const method = IpcParentType.ElectronUtilityProcess
  const sharedProcess = await SharedProcess.getOrCreate({
    env: {
      FOLDER: '',
    },
    method,
  })
  await ConnectIpc.connectIpc(method, sharedProcess, browserWindowPort, ipcId)
}
