import * as ExitCode from '../ExitCode/ExitCode.ts'
import * as GetPortTuple from '../GetPortTuple/GetPortTuple.ts'
import * as GetSharedProcessArgv from '../GetSharedProcessArgv/GetSharedProcessArgv.ts'
import * as HandleIpc from '../HandleIpc/HandleIpc.ts'
import * as IpcChild from '../IpcChild/IpcChild.ts'
import * as IpcChildType from '../IpcChildType/IpcChildType.ts'
import * as IpcId from '../IpcId/IpcId.ts'
import * as IpcParent from '../IpcParent/IpcParent.ts'
import * as JsonRpc from '../JsonRpc/JsonRpc.ts'
import * as Logger from '../Logger/Logger.ts'
import * as Performance from '../Performance/Performance.ts'
import * as PerformanceMarkerType from '../PerformanceMarkerType/PerformanceMarkerType.ts'
import * as Platform from '../Platform/Platform.ts'
import * as Process from '../Process/Process.ts'
import * as SharedProcessState from '../SharedProcessState/SharedProcessState.ts'

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

export const launchSharedProcess = async ({ method, env = {} }) => {
  Performance.mark(PerformanceMarkerType.WillStartSharedProcess)
  const sharedProcessPath = Platform.getSharedProcessPath()
  const execArgv = GetSharedProcessArgv.getSharedProcessArgv(Platform.isProduction)
  const fullEnv = {
    ...process.env,
    ...env,
  }
  const sharedProcess = await IpcParent.create({
    method,
    env: fullEnv,
    argv: [],
    execArgv,
    path: sharedProcessPath,
    name: 'shared-process',
  })
  // @ts-ignore
  sharedProcess._rawIpc.on('error', handleChildError)
  // @ts-ignore
  sharedProcess._rawIpc.on('exit', handleChildExit)
  // @ts-ignore
  sharedProcess._rawIpc.on('disconnect', handleChildDisconnect)
  HandleIpc.handleIpc(sharedProcess)

  // create secondary ipc to support transferring objects
  // from shared process to main process
  // TODO let shared process ask for secondary
  // ipc instead of sending it directly?
  const { port1, port2 } = GetPortTuple.getPortTuple()
  const childIpc = await IpcChild.listen({
    method: IpcChildType.ElectronMessagePort,
    messagePort: port1,
  })
  HandleIpc.handleIpc(childIpc)
  await JsonRpc.invokeAndTransfer(sharedProcess, 'HandleElectronMessagePort.handleElectronMessagePort', port2, IpcId.MainProcess)
  // @ts-ignore
  SharedProcessState.state.sharedProcess = sharedProcess
  Performance.mark(PerformanceMarkerType.DidStartSharedProcess)
  return sharedProcess
}
