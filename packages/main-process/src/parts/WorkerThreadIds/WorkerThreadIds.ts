import { setTimeout as delay } from 'node:timers/promises'

interface TraceEvent {
  readonly args?: { readonly data?: { readonly frame?: string; readonly workerId?: string; readonly workerThreadId?: number } }
  readonly name?: string
  readonly pid?: number
}

export interface Thread {
  readonly pid: number
  readonly tid: number
}

const expire = async (signal: AbortSignal): Promise<never> => {
  await delay(2000, undefined, { signal })
  throw new Error('Worker trace timed out')
}

// Tracing is browser-wide. Do not queue new recordings or interrupt another owner.
let recording = false

export const get = async (
  webContents: Electron.WebContents,
  targets: ReadonlySet<string>,
  signal: AbortSignal,
): Promise<ReadonlyMap<string, Thread>> => {
  const result = new Map<string, Thread>()
  if (recording || signal.aborted) return result
  recording = true
  const debuggerApi = webContents.debugger
  let started = false
  let onMessage: ((event: Electron.Event, method: string, params: any) => void) | undefined
  try {
    const { frameTree } = await debuggerApi.sendCommand('Page.getFrameTree')
    const pid = webContents.getOSProcessId()
    const complete = Promise.withResolvers<void>()
    onMessage = (_event, method, params): void => {
      if (method === 'Tracing.tracingComplete') complete.resolve()
      if (method !== 'Tracing.dataCollected') return
      for (const event of params.value as readonly TraceEvent[]) {
        const data = event.args?.data
        if (event.name !== 'TracingSessionIdForWorker' || event.pid !== pid || !data || data.frame !== frameTree.frame.id) continue
        const { workerId, workerThreadId } = data
        if (workerId && targets.has(workerId) && typeof workerThreadId === 'number' && Number.isSafeInteger(workerThreadId) && workerThreadId > 0)
          result.set(workerId, { pid, tid: workerThreadId })
      }
    }
    debuggerApi.on('message', onMessage)
    if (signal.aborted) return result
    // Only identity metadata is retained; periodic CPU sampling uses /proc, not profiling.
    await debuggerApi.sendCommand('Tracing.start', { categories: 'disabled-by-default-devtools.timeline', transferMode: 'ReportEvents' })
    started = true
    try {
      await delay(100, undefined, { signal })
    } catch {
      // Disposal interrupts the delay, then ends only our own recording.
    }
    await debuggerApi.sendCommand('Tracing.end')
    started = false
    const timeout = new AbortController()
    try {
      await Promise.race([complete.promise, expire(timeout.signal)])
    } finally {
      timeout.abort()
    }
    return signal.aborted ? new Map() : result
  } catch {
    // Unsupported tracing, DevTools recording, or a disconnected debugger: unavailable.
    return new Map()
  } finally {
    if (started) {
      try {
        await debuggerApi.sendCommand('Tracing.end')
      } catch {
        // A disconnected debugger has already ended its recording.
      }
    }
    if (onMessage) debuggerApi.removeListener('message', onMessage)
    recording = false
  }
}
