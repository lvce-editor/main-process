import * as Electron from 'electron'
import { closeSync, mkdirSync, openSync, rmSync, writeSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import * as Assert from '../Assert/Assert.ts'
import * as ElectronWebContentsViewState from '../ElectronWebContentsViewState/ElectronWebContentsViewState.ts'

const getFileName = (pid: number): string => {
  return `renderer-${pid}-${Date.now()}.heapsnapshot`
}

const getRendererWebContents = (pid: number): Electron.WebContents | undefined => {
  for (const browserWindow of Electron.BrowserWindow.getAllWindows()) {
    const { webContents } = browserWindow
    if (webContents.getOSProcessId() === pid) {
      return webContents
    }
  }
  for (const value of ElectronWebContentsViewState.getAll()) {
    const { webContents } = (value as { readonly view: Electron.WebContentsView }).view
    if (webContents.getOSProcessId() === pid) {
      return webContents
    }
  }
  return undefined
}

export const takeRendererHeapSnapshot = async (pid: number): Promise<string> => {
  Assert.number(pid)
  const webContents = getRendererWebContents(pid)
  if (!webContents) {
    throw new Error(`Renderer process not found: ${pid}`)
  }
  if (webContents.isDestroyed()) {
    throw new Error(`Renderer process was destroyed: ${pid}`)
  }
  const electronDebugger = webContents.debugger
  const wasAttached = electronDebugger.isAttached()
  let fileDescriptor: number | undefined
  let filePath = ''
  let writeError: Error | undefined
  let success = false
  if (!wasAttached) {
    electronDebugger.attach()
  }
  try {
    const downloadsPath = Electron.app.getPath('downloads')
    mkdirSync(downloadsPath, { recursive: true })
    filePath = join(downloadsPath, getFileName(pid))
    fileDescriptor = openSync(filePath, 'wx')
    const currentFileDescriptor = fileDescriptor
    const handleMessage = (_event: unknown, method: string, parameters: any, sessionId?: string): void => {
      if (method !== 'HeapProfiler.addHeapSnapshotChunk' || sessionId || writeError) {
        return
      }
      try {
        writeSync(currentFileDescriptor, parameters.chunk)
      } catch (error) {
        writeError = error as Error
      }
    }
    electronDebugger.on('message', handleMessage)
    try {
      await electronDebugger.sendCommand('HeapProfiler.enable')
      await electronDebugger.sendCommand('HeapProfiler.takeHeapSnapshot', { reportProgress: false })
      if (writeError) {
        throw writeError
      }
    } finally {
      electronDebugger.off('message', handleMessage)
    }
    success = true
    return pathToFileURL(filePath).href
  } finally {
    try {
      if (fileDescriptor !== undefined) {
        closeSync(fileDescriptor)
      }
      if (!success && filePath) {
        rmSync(filePath, { force: true })
      }
    } finally {
      if (!wasAttached && electronDebugger.isAttached()) {
        electronDebugger.detach()
      }
    }
  }
}
