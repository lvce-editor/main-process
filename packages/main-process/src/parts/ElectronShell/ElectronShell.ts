import { shell } from 'electron'

export const showItemInFolder = (fullPath) => {
  shell.showItemInFolder(fullPath)
}

export const openPath = async (path) => {
  // TODO handle error
  await shell.openPath(path)
}
