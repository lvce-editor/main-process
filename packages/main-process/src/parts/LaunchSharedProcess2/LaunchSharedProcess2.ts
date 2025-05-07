import { ElectronUtilityProcessRpcParent } from '@lvce-editor/rpc'
import * as CommandMap from '../CommandMap/CommandMap.ts'
import * as GetSharedProcessArgv from '../GetSharedProcessArgv/GetSharedProcessArgv.ts'
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
    commandMap: CommandMap.commandMap,
    // @ts-ignore
    requiresSocket: RequiresSocket.requiresSocket,
  })
  return sharedProcess
}
