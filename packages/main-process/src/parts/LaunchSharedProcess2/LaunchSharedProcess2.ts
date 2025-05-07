import { ElectronUtilityProcessRpcParent } from '@lvce-editor/rpc'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.ts'
import * as GetPortTuple from '../GetPortTuple/GetPortTuple.ts'
import * as GetSharedProcessArgv from '../GetSharedProcessArgv/GetSharedProcessArgv.ts'
import * as HandleIpc from '../HandleIpc/HandleIpc.ts'
import * as IpcChild from '../IpcChild/IpcChild.ts'
import * as IpcChildType from '../IpcChildType/IpcChildType.ts'
import * as IpcId from '../IpcId/IpcId.ts'
import * as Performance from '../Performance/Performance.ts'
import * as PerformanceMarkerType from '../PerformanceMarkerType/PerformanceMarkerType.ts'
import * as Platform from '../Platform/Platform.ts'
import * as RequiresSocket from '../RequiresSocket/RequiresSocket.ts'

export const launchSharedProcess2 = async ({ method, env = {} }) => {
  Performance.mark(PerformanceMarkerType.WillStartSharedProcess)
  const sharedProcessPath = Platform.getSharedProcessPath()
  const execArgv = GetSharedProcessArgv.getSharedProcessArgv(Platform.isProduction)
  const fullEnv = {
    ...process.env,
    ...env,
  }
  const sharedProcess = await ElectronUtilityProcessRpcParent.create({
    env: fullEnv,
    argv: [],
    execArgv,
    path: sharedProcessPath,
    name: 'shared-process',
    commandMap: CommandMapRef.commandMapRef,
    // @ts-ignore
    requiresSocket: RequiresSocket.requiresSocket,
  })

  const { port1, port2 } = GetPortTuple.getPortTuple()
  const childIpc = await IpcChild.listen({
    method: IpcChildType.ElectronMessagePort,
    messagePort: port1,
  })
  HandleIpc.handleIpc(childIpc)
  await sharedProcess.invokeAndTransfer('HandleElectronMessagePort.handleElectronMessagePort', port2, IpcId.MainProcess)

  return sharedProcess
}
