import { Menu } from 'electron'
import * as Assert from '../Assert/Assert.ts'
import * as SharedProcess from '../SharedProcess/SharedProcess.ts'

export const setMenu = (menu) => {
  Menu.setApplicationMenu(menu)
}

const click = async (menuItem, browserWindow, keys) => {
  await SharedProcess.send('ElectronApplicationMenu.handleClick', browserWindow.id, menuItem.label)
}

const addClickListener = (item) => {
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
  }
}

export const setItems = (items) => {
  Assert.array(items)
  const itemsWithClickListeners = items.map(addClickListener)
  const menu = Menu.buildFromTemplate(itemsWithClickListeners)
  setMenu(menu)
}

export const createTitleBar = (items) => {
  const menuBar = Menu.buildFromTemplate(items)
  return menuBar
}
