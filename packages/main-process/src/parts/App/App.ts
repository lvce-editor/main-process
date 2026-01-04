import * as Electron from 'electron'
import unhandled from 'electron-unhandled' // TODO this might slow down initial startup
import { spawn } from 'node:child_process'
import * as AppPaths from '../AppPaths/AppPaths.ts'
import * as Cli from '../Cli/Cli.ts'
import * as CommandLineSwitches from '../CommandLineSwitches/CommandLineSwitches.ts'
import * as Debug from '../Debug/Debug.ts'
import * as ElectronApp from '../ElectronApp/ElectronApp.ts'
import * as ElectronAppEventType from '../ElectronAppEventType/ElectronAppEventType.ts'
import * as ElectronApplicationMenu from '../ElectronApplicationMenu/ElectronApplicationMenu.ts'
import * as ElectronAppListeners from '../ElectronAppListeners/ElectronAppListeners.ts'
import * as Exit from '../Exit/Exit.ts'
import * as ExitCode from '../ExitCode/ExitCode.ts'
import * as HandleElectronReady from '../HandleElectronReady/HandleElectronReady.ts'
import * as HandleSecondInstance from '../HandleSecondInstance/HandleSecondInstance.ts'
import * as HandleWebContentsCreated from '../HandleWebContentsCreated/HandleWebContentsCreated.ts'
import * as HandleWindowAllClosed from '../HandleWindowAllClosed/HandleWindowAllClosed.ts'
import * as ParseCliArgs from '../ParseCliArgs/ParseCliArgs.ts'
import * as Performance from '../Performance/Performance.ts'
import * as PerformanceMarkerType from '../PerformanceMarkerType/PerformanceMarkerType.ts'
import * as Process from '../Process/Process.ts'
import * as Protocol from '../Protocol/Protocol.ts'
import * as SingleInstanceLock from '../SingleInstanceLock/SingleInstanceLock.ts'

// TODO maybe handle critical (first render) request via ipcMain
// and spawn shared process when page is idle/loaded
// currently launching shared process takes 170ms
// which means first paint is delayed by a lot

export const hydrate = async (isLinux: boolean, chromeUserDataPath: string, argv: readonly string[]) => {
  ElectronApplicationMenu.setMenu(null) // performance
  unhandled({
    logger() {}, // already exists in mainProcessMain.js
    showDialog: true,
  })

  // TODO electron error ERROR:sandbox_linux.cc(364)] InitializeSandbox() called with multiple threads in process gpu-process

  // TODO electron error [90611:0219/003126.546542:ERROR:gl_surface_presentation_helper.cc(260)] GetVSyncParametersIfAvailable() failed for 1 times!
  // need to wait for solution https://github.com/electron/electron/issues/32760

  // TODO need to wait for playwright bugs to be resolved
  // before being able to test multi-window behavior
  // see https://github.com/microsoft/playwright/issues/12345

  const parsedCliArgs = ParseCliArgs.parseCliArgs(argv)
  const moduleId = Cli.canHandleFastCliArgs(parsedCliArgs)
  if (moduleId) {
    await Cli.handleFastCliArgs(moduleId, parsedCliArgs)
    return
  }
  if (isLinux && chromeUserDataPath) {
    AppPaths.setUserDataPath(chromeUserDataPath)
    AppPaths.setSessionDataPath(chromeUserDataPath)
    AppPaths.setCrashDumpsPath(chromeUserDataPath)
    AppPaths.setLogsPath(chromeUserDataPath)
  }

  const hasLock = SingleInstanceLock.requestSingleInstanceLock(argv)
  if (!hasLock) {
    Debug.debug('[info] quitting because no lock')
    Exit.exit()
    return
  }

  // TODO tree shake out the .env.DEV check: reading from env variables is expensive
  if (process.stdout.isTTY && !parsedCliArgs.wait && !process.env.DEV) {
    spawn(Process.execPath, argv.slice(1), {
      detached: true,
      stdio: 'ignore',
    })
    Process.exit(ExitCode.Success)
  }

  // command line switches
  CommandLineSwitches.enable(parsedCliArgs)

  // protocol
  Protocol.enable(Electron.protocol)

  // app
  ElectronApp.on(ElectronAppEventType.WindowAllClosed, HandleWindowAllClosed.handleWindowAllClosed)
  ElectronApp.on(ElectronAppEventType.BeforeQuit, ElectronAppListeners.handleBeforeQuit)
  ElectronApp.on(ElectronAppEventType.WebContentsCreated, HandleWebContentsCreated.handleWebContentsCreated)
  ElectronApp.on(ElectronAppEventType.SecondInstance, HandleSecondInstance.handleSecondInstance)
  await ElectronApp.whenReady()
  Performance.mark(PerformanceMarkerType.AppReady)

  await HandleElectronReady.handleReady(parsedCliArgs, Process.cwd())
  Debug.debug('[info] app window created')
}
