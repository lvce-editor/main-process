import type { MenuItemConstructorOptions, WebContents } from 'electron'

const editingActions = new Set(['undo', 'redo', 'cut', 'copy', 'paste', 'selectAll'])

export const getElectronMenuItems = (menuItems, click, contents?: WebContents): MenuItemConstructorOptions[] => {
  return menuItems.map((menuItem) => {
    const { role, ...options } = menuItem
    if (contents && editingActions.has(role)) {
      return {
        ...options,
        click(item): void {
          if (!contents.isDestroyed()) contents[role as 'undo' | 'redo' | 'cut' | 'copy' | 'paste' | 'selectAll']()
          click(item)
        },
      }
    }
    return { ...menuItem, click }
  })
}
