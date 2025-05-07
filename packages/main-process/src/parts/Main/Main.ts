// @ts-ignore
performance.mark('code/start')
import * as App from '../App/App.ts'
import * as Command from '../Command/Command.ts'
import * as CommandMap from '../CommandMap/CommandMap.ts'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.ts'
import * as ErrorHandling from '../ErrorHandling/ErrorHandling.ts'
import * as Module from '../Module/Module.ts'
import * as Process from '../Process/Process.ts'
import * as SetStackTraceLimit from '../SetStackTraceLimit/SetStackTraceLimit.ts'

export const main = async () => {
  Object.assign(CommandMapRef.commandMapRef, CommandMap.commandMap)
  SetStackTraceLimit.setStackTraceLimit(20)
  Process.on('uncaughtExceptionMonitor', ErrorHandling.handleUncaughtExceptionMonitor)
  // workaround for https://github.com/electron/electron/issues/36526
  Process.on('unhandledRejection', ErrorHandling.handleUnhandledRejection)
  Command.setLoad(Module.load)
  await App.hydrate()
}
