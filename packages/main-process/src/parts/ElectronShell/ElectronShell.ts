import { shell } from 'electron'
import { normalizePath } from '../NormalizePath/NormalizePath.ts'

export const showItemInFolder = (fullPath: string): void => {
  const normalized = normalizePath(fullPath)
  shell.showItemInFolder(normalized)
}

export const openPath = async (path: string): Promise<void> => {
  // TODO handle error
  await shell.openPath(path)
}
