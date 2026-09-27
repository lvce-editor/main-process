import type { WebContents } from 'electron'
import * as ElectronWebContentsViewIpc from '../ElectronWebContentsViewIpc/ElectronWebContentsViewIpc.ts'
import * as ElectronWebContentsViewState from '../ElectronWebContentsViewState/ElectronWebContentsViewState.ts'
import * as KeyCode from '../KeyCode/KeyCode.ts'

export const attach = (webContents: WebContents): void => {
  webContents.ipc.on('browser-period-keybinding', (event) => {
    const enabled = (ElectronWebContentsViewState.getFallthroughKeyBindings() as readonly number[]).includes(KeyCode.Period)
    event.returnValue = enabled
    if (enabled) {
      ElectronWebContentsViewIpc.send(webContents.id, 'ElectronBrowserView.handleKeyBinding', webContents.id, KeyCode.Period)
    }
  })
}
