import { Menu } from 'electron'
import * as Assert from '../Assert/Assert.ts'
import * as SharedProcess from '../SharedProcess/SharedProcess.ts'

export const setMenu = (menu: Electron.Menu | null): void => {
  Menu.setApplicationMenu(menu)
}

const click = async (menuItem: Electron.MenuItem, browserWindow: Electron.BaseWindow | undefined, keys) => {
  if (!browserWindow) {
    return
  }
  await SharedProcess.send('ElectronApplicationMenu.handleClick', browserWindow.id, menuItem.label)
}

interface RawItem {
  readonly label: string
  readonly submenu?: readonly RawItem[]
}

const addClickListener = (item: RawItem): Electron.MenuItemConstructorOptions => {
  if (item.submenu) {
    return {
      ...item,
      click,
      submenu: item.submenu.map(addClickListener),
    }
  }
  return {
    ...item,
    click,
    submenu: undefined,
  }
}

export const setItems = (items: readonly RawItem[]) => {
  Assert.array(items)
  const itemsWithClickListeners = items.map(addClickListener)
  const menu = Menu.buildFromTemplate(itemsWithClickListeners)
  setMenu(menu)
}

export const createTitleBar = (items: Electron.MenuItem[]) => {
  const menuBar = Menu.buildFromTemplate(items)
  return menuBar
}
