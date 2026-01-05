import { BrowserWindow, Menu } from 'electron'
import * as Assert from '../Assert/Assert.ts'
import * as GetElectronContextMenuCallbacks from '../GetElectronContextMenuCallbacks/GetElectronContextMenuCallbacks.ts'
import * as GetElectronMenuItems from '../GetElectronMenuItems/GetElectronMenuItems.ts'

// @ts-ignore
export const openContextMenu = async (menuItems, x, y) => {
  Assert.array(menuItems)
  Assert.number(x)
  Assert.number(y)
  const { handleClick, handleClose, promise } = GetElectronContextMenuCallbacks.getElectronCallbacks()
  const template = GetElectronMenuItems.getElectronMenuItems(menuItems, handleClick)
  const menu = Menu.buildFromTemplate(template)
  // TODO pass window id
  const window = BrowserWindow.getFocusedWindow()
  if (!window) {
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
