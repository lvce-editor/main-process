import * as ElectronWebContentsEventType from '../ElectronWebContentsEventType/ElectronWebContentsEventType.ts'
import * as ElectronWindowOpenActionType from '../ElectronWindowOpenActionType/ElectronWindowOpenActionType.ts'
import * as Logger from '../Logger/Logger.ts'
import { openExternal } from '../OpenExternal/OpenExternal.ts'
import * as ShouldAllowNavigation from '../ShouldAllowNavigation/ShouldAllowNavigation.ts'

const handleWebContentsWindowOpen = ({ url }: { url: string }) => {
  void openExternal(url)
  return {
    action: ElectronWindowOpenActionType.Deny,
  }
}

/**
 *
 * @param {*} event
 * @param {Electron.WebContents} webContents
 */
export const handleWebContentsCreated = (event, webContents: Electron.WebContents) => {
  /**
   *
   * @param {import('electron').Event<import('electron').WebContentsWillNavigateEventParams>} event
   * @returns
   */
  const handleWebContentsNavigate = (event) => {
    if (ShouldAllowNavigation.shouldAllowNavigation(webContents.id)) {
      return
    }
    Logger.error('[main-process] Prevented webcontent navigation')
    event.preventDefault()
  }
  webContents.on(ElectronWebContentsEventType.WillNavigate, handleWebContentsNavigate)
  // @ts-ignore
  webContents.setWindowOpenHandler(handleWebContentsWindowOpen)
}
