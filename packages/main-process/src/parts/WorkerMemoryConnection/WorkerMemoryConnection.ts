import * as WorkerMemoryDebugger from '../WorkerMemoryDebugger/WorkerMemoryDebugger.ts'

interface TargetInfo {
  readonly parentFrameId?: string
  readonly targetId: string
  readonly type: string
}

export const create = (webContents: Electron.WebContents) => {
  const debuggerApi = webContents.debugger
  const release = WorkerMemoryDebugger.acquire(debuggerApi)
  const sessions = new Set<string>()
  let closed = false
  let initialization: Promise<void> | undefined

  const detach = async (sessionId: string): Promise<void> => {
    sessions.delete(sessionId)
    try {
      await debuggerApi.sendCommand('Target.detachFromTarget', { sessionId })
    } catch {
      // The target or debugger may already have closed.
    }
  }
  const initialize = async (): Promise<void> => {
    const { frameTree } = await debuggerApi.sendCommand('Page.getFrameTree')
    if (closed) return
    const { sessionId } = await debuggerApi.sendCommand('Target.attachToTarget', { flatten: true, targetId: frameTree.frame.id })
    if (closed) {
      await detach(sessionId)
      return
    }
    sessions.add(sessionId)
    // Worker targets need auto-attachment to initialize their inspector without
    // DevTools open. A separate page session keeps this configuration private.
    await debuggerApi.sendCommand(
      'Target.setAutoAttach',
      {
        autoAttach: true,
        filter: [{ type: 'worker' }, { exclude: true }],
        flatten: true,
        waitForDebuggerOnStart: false,
      },
      sessionId,
    )
  }
  const getTargets = async (): Promise<readonly string[]> => {
    initialization ||= initialize()
    await initialization
    if (closed) return []
    const { frameTree } = await debuggerApi.sendCommand('Page.getFrameTree')
    const { targetInfos } = await debuggerApi.sendCommand('Target.getTargets')
    return targetInfos
      .filter((target: TargetInfo) => target.type === 'worker' && target.parentFrameId === frameTree.frame.id)
      .map((target: TargetInfo) => target.targetId)
  }
  const attach = async (targetIds: readonly string[]) => {
    // Validate the targets against this window before attaching.
    const allowed = new Set(await getTargets())
    return Promise.all(
      targetIds.map(async (targetId) => {
        if (closed || !allowed.has(targetId)) return null
        let sessionId: string | undefined
        try {
          const result = await debuggerApi.sendCommand('Target.attachToTarget', { flatten: true, targetId })
          sessionId = result.sessionId as string
          if (closed) {
            await detach(sessionId)
            return null
          }
          sessions.add(sessionId)
          const { result: evaluated } = await debuggerApi.sendCommand('Runtime.evaluate', { expression: 'self.name', returnByValue: true }, sessionId)
          if (closed || typeof evaluated.value !== 'string') {
            await detach(sessionId)
            return null
          }
          return { runtimeName: evaluated.value as string, sessionId, targetId }
        } catch {
          if (sessionId) await detach(sessionId)
          return null
        }
      }),
    )
  }
  const getHeapUsages = async (sessionIds: readonly string[]) =>
    Promise.all(
      sessionIds.map(async (sessionId) => {
        if (closed || !sessions.has(sessionId)) return null
        try {
          const { totalSize, usedSize } = await debuggerApi.sendCommand('Runtime.getHeapUsage', undefined, sessionId)
          if (!Number.isFinite(usedSize) || !Number.isFinite(totalSize)) return null
          return { totalSize, usedSize }
        } catch {
          return null
        }
      }),
    )
  const detachSessions = async (sessionIds: readonly string[]): Promise<void> => {
    await Promise.all(sessionIds.filter((id) => sessions.has(id)).map(detach))
  }
  const dispose = async (): Promise<void> => {
    if (closed) return
    closed = true
    await Promise.all(Array.from(sessions, detach))
    release()
  }
  const execute = async (method: string, values: readonly string[] = []): Promise<unknown> => {
    if (closed) throw new Error('Worker memory connection is closed')
    switch (method) {
      case 'WorkerMemory.attach':
        return attach(values)
      case 'WorkerMemory.detach':
        return detachSessions(values)
      case 'WorkerMemory.getHeapUsages':
        return getHeapUsages(values)
      case 'WorkerMemory.getTargets':
        return getTargets()
      default:
        throw new Error(`Unknown worker memory command: ${method}`)
    }
  }
  return { dispose, execute }
}
