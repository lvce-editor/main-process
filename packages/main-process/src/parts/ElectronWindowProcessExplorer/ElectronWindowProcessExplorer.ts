import { BrowserWindow } from 'electron'
import * as Session from '../ElectronSession/ElectronSession.ts'
import * as ElectronWebContentsEventType from '../ElectronWebContentsEventType/ElectronWebContentsEventType.ts'
import * as HandleIpc from '../HandleIpc/HandleIpc.ts'
import * as IpcChild from '../IpcChild/IpcChild.ts'
import * as IpcChildType from '../IpcChildType/IpcChildType.ts'

export const open2 = async (options, url) => {
  const allOptions = {
    ...options,
    webPreferences: {
      ...options.webPreferences,
      session: Session.get(),
    },
  }
  const processExplorerWindow = new BrowserWindow(allOptions)

  /**
   *
   * @param {Electron.Event} event
   * @param {Electron.Input} input
   */
  const handleBeforeInput = (event, input) => {
    if (input.control && input.key.toLowerCase() === 'i') {
      event.preventDefault()
      processExplorerWindow.webContents.openDevTools()
    }
    if (input.code && input.key.toLowerCase() === 'r') {
      event.preventDefault()
      processExplorerWindow.reload()
    }
  }

  processExplorerWindow.setMenuBarVisibility(false)
  processExplorerWindow.webContents.on(ElectronWebContentsEventType.BeforeInputEvent, handleBeforeInput)

  const ipc = await IpcChild.listen({
    method: IpcChildType.RendererProcess2,
    webContents: processExplorerWindow.webContents,
  })
  HandleIpc.handleIpc(ipc)

  try {
    await processExplorerWindow.loadURL(url)
  } catch (error) {
    console.error(error)
    // @ts-ignore
    // throw new VError(error, `Failed to load process explorer url `)
  }
}
