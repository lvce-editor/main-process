import { BrowserWindow } from 'electron'
import { isAbsolute, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as AppWindowRpc from '../AppWindowRpc/AppWindowRpc.ts'

const getPath = (parsedArgs: any, workingDirectory: string): string => {
  const path = parsedArgs?._?.at(-1)
  if (!path || typeof path !== 'string') {
    return ''
  }
  if (path.startsWith('file://')) {
    return fileURLToPath(path)
  }
  return isAbsolute(path) ? path : resolve(workingDirectory, path)
}

const getWindow = (): any => {
  return BrowserWindow.getFocusedWindow() || AppWindowRpc.getLastFocusedWindow() || BrowserWindow.getAllWindows()[0]
}

export const reuseAppWindow = async (parsedArgs: any, workingDirectory: string): Promise<boolean> => {
  const path = getPath(parsedArgs, workingDirectory)
  if (!path) {
    return false
  }
  const window = getWindow()
  if (!window) {
    return false
  }
  const rpc = AppWindowRpc.get(window)
  if (!rpc) {
    return false
  }
  await rpc.invoke('Workspace.setUri', pathToFileURL(path).toString())
  window.focus()
  return true
}
