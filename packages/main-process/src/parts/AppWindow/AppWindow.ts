import { ElectronWebContentsRpcClient } from '@lvce-editor/rpc'
import { BrowserWindow } from 'electron'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.ts'
import * as ElectronApplicationMenu from '../ElectronApplicationMenu/ElectronApplicationMenu.ts'
import * as Session from '../ElectronSession/ElectronSession.ts'
import * as ErrorHandling from '../ErrorHandling/ErrorHandling.ts'
import * as LifeCycle from '../LifeCycle/LifeCycle.ts'
import * as Logger from '../Logger/Logger.ts'
import * as Performance from '../Performance/Performance.ts'
import * as PerformanceMarkerType from '../PerformanceMarkerType/PerformanceMarkerType.ts'
import { VError } from '../VError/VError.ts'
import { WindowLoadError } from '../WindowLoadError/WindowLoadError.ts'
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

  const handleReadyToShow = () => {
    // due to electron bug, zoom level needs to be set here,
    // cannot be set when creating the browser window
    // window .webContents.setZoomLevel(zoomLevel)
    window.show()
  }
  window.once('ready-to-show', handleReadyToShow)
  // TODO query applicarion menu items from shared process
  const menu = ElectronApplicationMenu.createTitleBar(titleBarItems)
  ElectronApplicationMenu.setMenu(menu)

  // window.setMenu(menu)
  window.setMenuBarVisibility(true)
  window.setAutoHideMenuBar(false)
  // TODO send event to shared process
  const handleWindowClose = () => {
    try {
      window.off('close', handleWindowClose)
    } catch (error) {
      ErrorHandling.handleError(new VError(error, `Failed to run window close listener`))
    }
  }
  window.on('close', handleWindowClose)
  await ElectronWebContentsRpcClient.create({
    webContents: window.webContents,
    commandMap: CommandMapRef.commandMapRef,
  })
  await loadUrl(window, url)
}
