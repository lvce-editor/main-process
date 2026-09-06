import { BrowserWindow, Menu } from 'electron'
import * as Assert from '../Assert/Assert.ts'
import * as ElectronWebContentsViewState from '../ElectronWebContentsViewState/ElectronWebContentsViewState.ts'
import * as GetElectronContextMenuCallbacks from '../GetElectronContextMenuCallbacks/GetElectronContextMenuCallbacks.ts'
import * as GetElectronMenuItems from '../GetElectronMenuItems/GetElectronMenuItems.ts'

export const openContextMenu = async (menuItems: readonly any[], x: number, y: number, browserViewId?: number): Promise<any> => {
  Assert.array(menuItems)
  Assert.number(x)
  Assert.number(y)
  const origin = browserViewId === undefined ? undefined : ElectronWebContentsViewState.get(browserViewId)
  if (browserViewId !== undefined && (!origin || origin.view.webContents.isDestroyed())) return { data: undefined, type: 'close' }
  const { handleClick, handleClose, promise } = GetElectronContextMenuCallbacks.getElectronCallbacks()
  const template = GetElectronMenuItems.getElectronMenuItems(menuItems, handleClick, origin?.view.webContents)
  const menu = Menu.buildFromTemplate(template)
  const window = origin?.browserWindow || BrowserWindow.getFocusedWindow()
  if (!window || window.isDestroyed()) {
    return {
      data: undefined,
      type: 'close',
    }
  }
  menu.popup({
    callback: handleClose,
    window,
    x,
    y,
  })
  const event = await promise
  // @ts-ignore
  if (event.type === 'click') {
    return {
      // @ts-ignore
      data: event.data.label,
      type: 'click',
    }
  }
  // @ts-ignore
  if (event.type === 'close') {
    return {
      data: undefined,
      type: 'close',
    }
  }
}
