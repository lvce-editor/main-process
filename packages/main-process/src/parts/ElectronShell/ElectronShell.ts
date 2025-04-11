import { shell } from 'electron'

export const showItemInFolder = (fullPath: string): void => {
  shell.showItemInFolder(fullPath)
}

export const openPath = async (path: string): Promise<void> => {
  // TODO handle error
  await shell.openPath(path)
}
