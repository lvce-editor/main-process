import { BrowserWindow, Menu } from 'electron'
import * as Assert from '../Assert/Assert.ts'
import * as GetElectronContextMenuCallbacks from '../GetElectronContextMenuCallbacks/GetElectronContextMenuCallbacks.js'
import * as GetElectronMenuItems from '../GetElectronMenuItems/GetElectronMenuItems.js'

// @ts-ignore
export const openContextMenu = async (menuItems, x, y) => {
  Assert.array(menuItems)
  Assert.number(x)
  Assert.number(y)
  const { promise, handleClick, handleClose } = GetElectronContextMenuCallbacks.getElectronCallbacks()
  const template = GetElectronMenuItems.getElectronMenuItems(menuItems, handleClick)
  const menu = Menu.buildFromTemplate(template)
  const window = BrowserWindow.getFocusedWindow()
  if (!window) {
    return {
      type: 'close',
      data: undefined,
    }
  }
  menu.popup({
    window,
    x,
    y,
    callback: handleClose,
  })
  const event = await promise
  // @ts-ignore
  if (event.type === 'click') {
    return {
      type: 'click',
      // @ts-ignore
      data: event.data.label,
    }
  }
  // @ts-ignore
  if (event.type === 'close') {
    return {
      type: 'close',
      data: undefined,
    }
  }
}
