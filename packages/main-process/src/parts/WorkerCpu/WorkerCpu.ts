import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import type { Sample } from '../WorkerCpuSample/WorkerCpuSample.ts'
import * as WorkerCpuSample from '../WorkerCpuSample/WorkerCpuSample.ts'
import * as WorkerThreadIds from '../WorkerThreadIds/WorkerThreadIds.ts'

let clockTicks: Promise<number> | undefined
const readClockTicks = async (): Promise<number> => {
  try {
    const { stdout } = await promisify(execFile)('getconf', ['CLK_TCK'], { timeout: 2000 })
    return Number(stdout.trim())
  } catch {
    return NaN
  }
}
const getClockTicks = (): Promise<number> => {
  clockTicks ||= readClockTicks()
  return clockTicks
}

export const create = (webContents: Electron.WebContents) => {
  const controller = new AbortController()
  const attempted = new Set<string>()
  const threads = new Map<string, WorkerThreadIds.Thread>()
  const samples = new Map<string, Sample>()
  let pending: Promise<readonly (number | null)[]> | undefined
  const query = async (targetIds: readonly string[]): Promise<readonly (number | null)[]> => {
    if (process.platform !== 'linux' || controller.signal.aborted) return targetIds.map(() => null)
    const active = new Set(targetIds)
    for (const target of attempted) {
      if (active.has(target)) continue
      attempted.delete(target)
      threads.delete(target)
      samples.delete(target)
    }
    const added = new Set(targetIds.filter((target) => target !== '' && !attempted.has(target)))
    if (added.size > 0) {
      for (const target of added) attempted.add(target)
      const discovered = await WorkerThreadIds.get(webContents, added, controller.signal)
      for (const [target, thread] of discovered) threads.set(target, thread)
    }
    const ticksPerSecond = await getClockTicks()
    if (controller.signal.aborted) return targetIds.map(() => null)
    const pid = webContents.getOSProcessId()
    return Promise.all(
      targetIds.map(async (target) => {
        const thread = threads.get(target)
        if (!thread || thread.pid !== pid || !webContents.debugger.isAttached()) return null
        try {
          const stat = await readFile(`/proc/${thread.pid}/task/${thread.tid}/stat`, 'utf8')
          if (controller.signal.aborted) return null
          const current = WorkerCpuSample.parse(stat, performance.now())
          if (!current) throw new Error('Invalid thread counters')
          const previous = samples.get(target)
          if (previous && current.startTime !== previous.startTime) throw new Error('Worker thread was replaced')
          samples.set(target, current)
          return WorkerCpuSample.percentage(previous, current, ticksPerSecond)
        } catch {
          samples.delete(target)
          threads.delete(target)
          return null
        }
      }),
    )
  }
  const get = async (targetIds: readonly string[]): Promise<readonly (number | null)[]> => {
    // The bridge serializes refreshes; overlapping callers must not share mismatched results.
    if (pending) return targetIds.map(() => null)
    pending = query(targetIds)
    try {
      return await pending
    } finally {
      pending = undefined
    }
  }
  const dispose = async (): Promise<void> => {
    controller.abort()
    try {
      await pending
    } catch {
      // A failed request still releases all connection state.
    }
    attempted.clear()
    threads.clear()
    samples.clear()
  }
  return { dispose, get }
}
