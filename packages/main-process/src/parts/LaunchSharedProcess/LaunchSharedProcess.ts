import { ElectronMessagePortRpcClient, ElectronUtilityProcessRpcParent } from '@lvce-editor/rpc'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.ts'
import * as ExitCode from '../ExitCode/ExitCode.ts'
import * as GetPortTuple from '../GetPortTuple/GetPortTuple.ts'
import * as GetSharedProcessArgv from '../GetSharedProcessArgv/GetSharedProcessArgv.ts'
import * as IpcId from '../IpcId/IpcId.ts'
import * as Logger from '../Logger/Logger.ts'
import * as Performance from '../Performance/Performance.ts'
import * as PerformanceMarkerType from '../PerformanceMarkerType/PerformanceMarkerType.ts'
import * as Platform from '../Platform/Platform.ts'
import * as Process from '../Process/Process.ts'
import * as RequiresSocket from '../RequiresSocket/RequiresSocket.ts'

const handleChildError = (error) => {
  Process.exit(ExitCode.Error)
}

const handleChildExit = (code) => {
  Logger.info(`[main process] shared process exited with code ${code}`)
  Process.exit(code)
}

const handleChildDisconnect = () => {
  Logger.info('[main process] shared process disconnected')
}

export const launchSharedProcess = async ({ env = {}, method }) => {
  Performance.mark(PerformanceMarkerType.WillStartSharedProcess)
  const sharedProcessPath = Platform.getSharedProcessPath()
  const execArgv = GetSharedProcessArgv.getSharedProcessArgv(Platform.isProduction)
  const fullEnv = {
    ...process.env,
    ...env,
  }
  const sharedProcessRpc = await ElectronUtilityProcessRpcParent.create({
    argv: [],
    commandMap: CommandMapRef.commandMapRef,
    env: fullEnv,
    execArgv,
    name: 'shared-process',
    path: sharedProcessPath,
    // @ts-ignore
    requiresSocket: RequiresSocket.requiresSocket,
  })

  // @ts-ignore
  const sharedProcess = sharedProcessRpc.ipc
  // @ts-ignore
  sharedProcess._rawIpc.on('error', handleChildError)
  // @ts-ignore
  sharedProcess._rawIpc.on('exit', handleChildExit)
  // @ts-ignore
  sharedProcess._rawIpc.on('disconnect', handleChildDisconnect)

  // create secondary ipc to support transferring objects
  // from shared process to main process
  // TODO let shared process ask for secondary
  // ipc instead of sending it directly?
  const { port1, port2 } = GetPortTuple.getPortTuple()

  await sharedProcessRpc.invokeAndTransfer('HandleElectronMessagePort.handleElectronMessagePort', port2, IpcId.MainProcess)

  await ElectronMessagePortRpcClient.create({
    commandMap: CommandMapRef.commandMapRef,
    messagePort: port1,
    requiresSocket: RequiresSocket.requiresSocket,
  })

  Performance.mark(PerformanceMarkerType.DidStartSharedProcess)
  return sharedProcessRpc
}
