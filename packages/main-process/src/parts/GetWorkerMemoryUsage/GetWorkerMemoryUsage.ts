import * as Electron from 'electron'
import * as Assert from '../Assert/Assert.ts'

interface TargetInfo {
  readonly parentFrameId?: string
  readonly targetId: string
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

interface RuntimeEvaluateResult {
  readonly result: {
    readonly value?: unknown
  }
}

export interface WorkerMemoryUsage {
  readonly usedSize: number
  readonly totalSize: number
}

export const getWorkerMemoryUsage = async (windowId: number, runtimeName: string): Promise<WorkerMemoryUsage | null> => {
  Assert.number(windowId)
  Assert.string(runtimeName)
  const browserWindow = Electron.BrowserWindow.fromId(windowId)
  if (!browserWindow) {
    return null
  }
  const electronDebugger = browserWindow.webContents.debugger
  const wasAttached = electronDebugger.isAttached()
  if (!wasAttached) {
    electronDebugger.attach()
  }
  try {
    const { frameTree } = (await electronDebugger.sendCommand('Page.getFrameTree')) as FrameTreeResult
    const { targetInfos } = (await electronDebugger.sendCommand('Target.getTargets')) as TargetInfosResult
    const targets = targetInfos.filter((target) => target.type === 'worker' && target.parentFrameId === frameTree.frame.id)
    for (const target of targets) {
      let sessionId = ''
      try {
        const attached = (await electronDebugger.sendCommand('Target.attachToTarget', {
          flatten: true,
          targetId: target.targetId,
        })) as { readonly sessionId: string }
        sessionId = attached.sessionId
        const evaluated = (await electronDebugger.sendCommand(
          'Runtime.evaluate',
          { expression: 'self.name', returnByValue: true },
          sessionId,
        )) as RuntimeEvaluateResult
        if (evaluated.result.value !== runtimeName) {
          continue
        }
        const memory = (await electronDebugger.sendCommand('Runtime.getHeapUsage', undefined, sessionId)) as WorkerMemoryUsage
        if (!Number.isFinite(memory.usedSize) || !Number.isFinite(memory.totalSize)) {
          return null
        }
        return memory
      } catch {
        // The target may close while the live worker list is refreshed.
      } finally {
        if (sessionId && electronDebugger.isAttached()) {
          await electronDebugger.sendCommand('Target.detachFromTarget', { sessionId }).catch(() => {})
        }
      }
    }
    return null
  } finally {
    if (!wasAttached && electronDebugger.isAttached()) {
      electronDebugger.detach()
    }
  }
}
