import { BrowserWindow } from 'electron'
import { stat } from 'node:fs/promises'
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

const openUriInWindow = async (parsedArgs: any, workingDirectory: string, command: string): Promise<boolean> => {
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
  await rpc.invoke(command, pathToFileURL(path).toString())
  window.focus()
  return true
}

export const reuseAppWindow = async (parsedArgs: any, workingDirectory: string): Promise<boolean> => {
  return openUriInWindow(parsedArgs, workingDirectory, 'Workspace.setUri')
}

export const openFileInAppWindow = async (parsedArgs: any, workingDirectory: string): Promise<boolean> => {
  const rawPath = parsedArgs?._?.at(-1)
  if (typeof rawPath !== 'string' || (/^[a-z][a-z\d+.-]*:\/\//i.test(rawPath) && !rawPath.startsWith('file://'))) {
    return false
  }
  try {
    const path = getPath(parsedArgs, workingDirectory)
    if (!path) {
      return false
    }
    if (!(await stat(path)).isFile()) {
      return false
    }
  } catch {
    return false
  }
  try {
    return await openUriInWindow(parsedArgs, workingDirectory, 'Main.openUri')
  } catch {
    return false
  }
}
