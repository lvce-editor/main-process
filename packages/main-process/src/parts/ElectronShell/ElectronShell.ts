import { shell } from 'electron'
import * as OpenExternal from '../OpenExternal/OpenExternal.ts'

export const showItemInFolder = (fullPath) => {
  shell.showItemInFolder(fullPath)
}

/**
 * @deprecated use OpenExternal.openExternal function instead
 */
export const { openExternal } = OpenExternal

export const openPath = async (path) => {
  // TODO handle error
  await shell.openPath(path)
}

/**
 * @deprecated use Beep.beep instead
 */
export const beep = async () => {
  const Beep = await import('../Beep/Beep.ts')
  Beep.beep()
}
