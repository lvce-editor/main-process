import { ElectronWebContentsRpcClient } from '@lvce-editor/rpc'
import { BrowserWindow } from 'electron'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.ts'
import * as ElectronApplicationMenu from '../ElectronApplicationMenu/ElectronApplicationMenu.ts'
import * as ElectronWindowFullScreen from '../ElectronWindowFullScreen/ElectronWindowFullScreen.ts'
import * as Session from '../ElectronSession/ElectronSession.ts'
import * as ErrorHandling from '../ErrorHandling/ErrorHandling.ts'
import * as IsPromptMode from '../IsPromptMode/IsPromptMode.ts'
import * as LifeCycle from '../LifeCycle/LifeCycle.ts'
import * as Logger from '../Logger/Logger.ts'
import * as Performance from '../Performance/Performance.ts'
import * as PerformanceMarkerType from '../PerformanceMarkerType/PerformanceMarkerType.ts'
import { VError } from '../VError/VError.ts'
import { WindowLoadError } from '../WindowLoadError/WindowLoadError.ts'
import * as WindowLogger from '../WindowLogger/WindowLogger.ts'
// TODO impossible to test these methods
// and ensure that there is no memory leak

const loadUrl = async (browserWindow, url) => {
  Performance.mark(PerformanceMarkerType.WillLoadUrl)
  try {
    await browserWindow.loadURL(url)
  } catch (error) {
    if (LifeCycle.isShutDown()) {
      Logger.info('error during shutdown', error)
    } else {
      throw new WindowLoadError(error, url)
    }
  }
  Performance.mark(PerformanceMarkerType.DidLoadUrl)
}

const addDevDiagnostics = (window) => {
  if (!process.env.DEV) {
    return
  }
  window.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedUrl, isMainFrame) => {
    Logger.error(`[app window did-fail-load] code=${errorCode} mainFrame=${isMainFrame} url=${validatedUrl} error=${errorDescription}`)
  })
  window.webContents.on('render-process-gone', (_event, details) => {
    Logger.error(`[app window render-process-gone] reason=${details.reason} exitCode=${details.exitCode}`)
  })
  window.webContents.on('did-finish-load', () => {
    Logger.info('[app window did-finish-load]')
  })
}

// TODO avoid mixing BrowserWindow, childprocess and various lifecycle methods in one file -> separate concerns
export const createAppWindow = async (windowOptions, parsedArgs, workingDirectory, titleBarItems, url) => {
  const session = Session.get()
  Performance.mark(PerformanceMarkerType.WillCreateCodeWindow)
  const window = new BrowserWindow({
    ...windowOptions,
    webPreferences: {
      ...windowOptions.webPreferences,
      session,
    },
  })
  Performance.mark(PerformanceMarkerType.DidCreateCodeWindow)
  WindowLogger.addListener(window.webContents)
  addDevDiagnostics(window)

  const handleReadyToShow = () => {
    // due to electron bug, zoom level needs to be set here,
    // cannot be set when creating the browser window
    // window .webContents.setZoomLevel(zoomLevel)
    window.show()
  }
  if (!IsPromptMode.isPromptMode(parsedArgs)) {
    window.once('ready-to-show', handleReadyToShow)
  }
  // TODO query applicarion menu items from shared process
  const menu = ElectronApplicationMenu.createTitleBar(titleBarItems)
  ElectronApplicationMenu.setMenu(menu)

  // window.setMenu(menu)
  window.setMenuBarVisibility(true)
  window.setAutoHideMenuBar(false)
  const rpc = await ElectronWebContentsRpcClient.create({
    commandMap: CommandMapRef.commandMapRef,
    webContents: window.webContents,
  })
  const disposeFullScreenListener = ElectronWindowFullScreen.listen(window, rpc)
  const handleWindowClose = () => {
    try {
      disposeFullScreenListener()
      window.off('close', handleWindowClose)
    } catch (error) {
      ErrorHandling.handleError(new VError(error, `Failed to run window close listener`))
    }
  }
  window.on('close', handleWindowClose)
  await loadUrl(window, url)
}
