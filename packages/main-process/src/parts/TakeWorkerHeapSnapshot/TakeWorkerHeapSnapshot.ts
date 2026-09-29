import * as Electron from 'electron'
import { closeSync, mkdirSync, openSync, rmSync, writeSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import * as Assert from '../Assert/Assert.ts'

interface TargetInfo {
  readonly parentFrameId?: string
  readonly targetId: string
  readonly title: string
  readonly type: string
}

interface TargetInfosResult {
  readonly targetInfos: readonly TargetInfo[]
}

interface FrameTreeResult {
  readonly frameTree: {
    readonly frame: {
      readonly id: string
    }
  }
}

const getFileName = (workerName: string): string => {
  const safeWorkerName =
    workerName
      .replaceAll(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-/, '')
      .replace(/-$/, '') || 'worker'
  return `${safeWorkerName}-${Date.now()}.heapsnapshot`
}

const normalizeWorkerName = (workerName: string): string => {
  return workerName.replace(/^\[worker-\d+\] /, '').replace(/ \[worker-\d+\]$/, '')
}

export const takeWorkerHeapSnapshot = async (windowId: number, workerName: string): Promise<string> => {
  Assert.number(windowId)
  Assert.string(workerName)
  const browserWindow = Electron.BrowserWindow.fromId(windowId)
  if (!browserWindow) {
    throw new Error(`Browser window not found: ${windowId}`)
  }
  const electronDebugger = browserWindow.webContents.debugger
  const wasAttached = electronDebugger.isAttached()
  let fileDescriptor: number | undefined
  let filePath = ''
  let sessionId = ''
  let success = false
  if (!wasAttached) {
    electronDebugger.attach()
  }
  try {
    const { frameTree } = (await electronDebugger.sendCommand('Page.getFrameTree')) as FrameTreeResult
    const { targetInfos } = (await electronDebugger.sendCommand('Target.getTargets')) as TargetInfosResult
    const normalizedWorkerName = normalizeWorkerName(workerName)
    const matchingTargets = targetInfos.filter(
      (targetInfo) => targetInfo.type === 'worker' && normalizeWorkerName(targetInfo.title) === normalizedWorkerName,
    )
    const matchingFrameTargets = matchingTargets.filter((targetInfo) => targetInfo.parentFrameId === frameTree.frame.id)
    let target: TargetInfo | undefined
    if (matchingFrameTargets.length === 1) {
      target = matchingFrameTargets[0]
    } else if (matchingTargets.length === 1 && matchingTargets[0].parentFrameId === undefined) {
      target = matchingTargets[0]
    }
    if (!target) {
      throw new Error(`Worker not found: ${workerName}`)
    }
    const attachResult = await electronDebugger.sendCommand('Target.attachToTarget', {
      flatten: true,
      targetId: target.targetId,
    })
    sessionId = attachResult.sessionId
    const downloadsPath = Electron.app.getPath('downloads')
    mkdirSync(downloadsPath, { recursive: true })
    filePath = join(downloadsPath, getFileName(workerName))
    fileDescriptor = openSync(filePath, 'wx')
    const currentFileDescriptor = fileDescriptor
    let writeError: Error | undefined
    const handleMessage = (_event: unknown, method: string, parameters: any, messageSessionId: string): void => {
      if (method !== 'HeapProfiler.addHeapSnapshotChunk' || messageSessionId !== sessionId || writeError) {
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
      await electronDebugger.sendCommand('HeapProfiler.enable', undefined, sessionId)
      await electronDebugger.sendCommand('HeapProfiler.takeHeapSnapshot', { reportProgress: false }, sessionId)
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
      try {
        if (sessionId && electronDebugger.isAttached()) {
          await electronDebugger.sendCommand('Target.detachFromTarget', { sessionId })
        }
      } finally {
        if (!wasAttached && electronDebugger.isAttached()) {
          electronDebugger.detach()
        }
      }
    }
  }
}
