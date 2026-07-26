import * as Electron from 'electron'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import * as Assert from '../Assert/Assert.ts'

const profileDuration = 10_000

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

interface ProfileResult {
  readonly profile: unknown
}

const getFileName = (targetName: string): string => {
  const safeTargetName =
    targetName
      .replaceAll(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-/, '')
      .replace(/-$/, '') || 'extension-host'
  return `${safeTargetName}-${Date.now()}.cpuprofile`
}

const wait = async (): Promise<void> => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, profileDuration)
  })
}

const takeCpuProfile = async (windowId: number, workerName: string): Promise<string> => {
  const browserWindow = Electron.BrowserWindow.fromId(windowId)
  if (!browserWindow) {
    throw new Error(`Browser window not found: ${windowId}`)
  }
  const electronDebugger = browserWindow.webContents.debugger
  const wasAttached = electronDebugger.isAttached()
  let filePath = ''
  let profileStarted = false
  let profileStopped = false
  let sessionId: string | undefined
  let success = false
  if (!wasAttached) {
    electronDebugger.attach()
  }
  try {
    if (workerName) {
      const { frameTree } = (await electronDebugger.sendCommand('Page.getFrameTree')) as FrameTreeResult
      const { targetInfos } = (await electronDebugger.sendCommand('Target.getTargets')) as TargetInfosResult
      const target = targetInfos.find(
        (targetInfo) => targetInfo.type === 'worker' && targetInfo.title === workerName && targetInfo.parentFrameId === frameTree.frame.id,
      )
      if (!target) {
        throw new Error(`Worker not found: ${workerName}`)
      }
      const attachResult = await electronDebugger.sendCommand('Target.attachToTarget', {
        flatten: true,
        targetId: target.targetId,
      })
      sessionId = attachResult.sessionId
    }
    await electronDebugger.sendCommand('Profiler.enable', undefined, sessionId)
    await electronDebugger.sendCommand('Profiler.start', undefined, sessionId)
    profileStarted = true
    await wait()
    const { profile } = (await electronDebugger.sendCommand('Profiler.stop', undefined, sessionId)) as ProfileResult
    profileStopped = true
    const downloadsPath = Electron.app.getPath('downloads')
    mkdirSync(downloadsPath, { recursive: true })
    const targetName = workerName || `Extension Host Window ${windowId}`
    filePath = join(downloadsPath, getFileName(targetName))
    writeFileSync(filePath, JSON.stringify(profile), { flag: 'wx' })
    success = true
    return filePath
  } finally {
    try {
      if (profileStarted && !profileStopped && electronDebugger.isAttached()) {
        await electronDebugger.sendCommand('Profiler.stop', undefined, sessionId)
      }
      if (electronDebugger.isAttached()) {
        await electronDebugger.sendCommand('Profiler.disable', undefined, sessionId)
      }
    } finally {
      try {
        if (!success && filePath) {
          rmSync(filePath, { force: true })
        }
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

export const takeWindowCpuProfile = async (windowId: number): Promise<string> => {
  Assert.number(windowId)
  return takeCpuProfile(windowId, '')
}

export const takeWorkerCpuProfile = async (windowId: number, workerName: string): Promise<string> => {
  Assert.number(windowId)
  Assert.string(workerName)
  return takeCpuProfile(windowId, workerName)
}
