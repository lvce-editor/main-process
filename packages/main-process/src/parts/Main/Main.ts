// @ts-ignore
performance.mark('code/start')
import * as App from '../App/App.ts'
import * as Argv from '../Argv/Argv.ts'
import * as CommandMap from '../CommandMap/CommandMap.ts'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.ts'
import * as ErrorHandling from '../ErrorHandling/ErrorHandling.ts'
import * as Platform from '../Platform/Platform.ts'
import * as Process from '../Process/Process.ts'
import * as SetStackTraceLimit from '../SetStackTraceLimit/SetStackTraceLimit.ts'

export const main = async () => {
  Object.assign(CommandMapRef.commandMapRef, CommandMap.commandMap)
  SetStackTraceLimit.setStackTraceLimit(20)
  Process.on('uncaughtExceptionMonitor', ErrorHandling.handleUncaughtExceptionMonitor)
  // workaround for https://github.com/electron/electron/issues/36526
  Process.on('unhandledRejection', ErrorHandling.handleUnhandledRejection)
  await App.hydrate(Platform.isLinux, Platform.chromeUserDataPath, Argv.argv)
}
