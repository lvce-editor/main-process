import { expect, jest, test } from '@jest/globals'
import { EventEmitter } from 'node:events'
import { get } from '../src/parts/WorkerThreadIds/WorkerThreadIds.ts'

const fixture = () => {
  const debuggerApi = new EventEmitter() as EventEmitter & { sendCommand: ReturnType<typeof jest.fn<(...args: any[]) => Promise<any>>> }
  const event = (workerId: string, frame = 'frame', pid = 100) => ({
    args: { data: { frame, workerId, workerThreadId: 123 } },
    name: 'TracingSessionIdForWorker',
    pid,
  })
  debuggerApi.sendCommand = jest.fn<(...args: any[]) => Promise<any>>(async (method) => {
    switch (method) {
      case 'Page.getFrameTree':
        return { frameTree: { frame: { id: 'frame' } } }
      case 'Tracing.end':
        debuggerApi.emit('message', {}, 'Tracing.dataCollected', {
          value: [event('worker'), event('foreign', 'other'), event('other-process', 'frame', 200)],
        })
        debuggerApi.emit('message', {}, 'Tracing.tracingComplete', {})
        return {}
      case 'Tracing.start':
        return {}
      default:
        throw new Error(method)
    }
  })
  const webContents = { debugger: debuggerApi, getOSProcessId: () => 100 } as unknown as Electron.WebContents
  return { debuggerApi, webContents }
}

test('only maps explicitly requested workers in the owning frame and process, then removes listeners', async () => {
  const { debuggerApi, webContents } = fixture()
  const result = await get(webContents, new Set(['worker', 'foreign', 'other-process']), new AbortController().signal)
  expect([...result]).toEqual([['worker', { pid: 100, tid: 123 }]])
  expect(debuggerApi.listenerCount('message')).toBe(0)
})

test('does not stop another tracing owner, and a later connection can recover', async () => {
  const { debuggerApi, webContents } = fixture()
  const original = debuggerApi.sendCommand.getMockImplementation()!
  debuggerApi.sendCommand.mockImplementation(async (...args) => {
    if (args[0] === 'Tracing.start') throw new Error('Tracing already started')
    return original(...args)
  })
  expect((await get(webContents, new Set(['worker']), new AbortController().signal)).size).toBe(0)
  expect(debuggerApi.sendCommand).not.toHaveBeenCalledWith('Tracing.end')
  expect(debuggerApi.listenerCount('message')).toBe(0)
  debuggerApi.sendCommand.mockImplementation(original)
  expect((await get(webContents, new Set(['worker']), new AbortController().signal)).size).toBe(1)
})

test('disposal during capture ends our recording and discards results; overlapping capture does not start', async () => {
  const { debuggerApi, webContents } = fixture()
  const controller = new AbortController()
  const started = Promise.withResolvers<void>()
  const original = debuggerApi.sendCommand.getMockImplementation()!
  debuggerApi.sendCommand.mockImplementation(async (...args) => {
    if (args[0] === 'Tracing.start') started.resolve()
    return original(...args)
  })
  const pending = get(webContents, new Set(['worker']), controller.signal)
  await started.promise
  expect((await get(webContents, new Set(['worker']), new AbortController().signal)).size).toBe(0)
  controller.abort()
  expect((await pending).size).toBe(0)
  expect(debuggerApi.sendCommand).toHaveBeenCalledWith('Tracing.end')
  expect(debuggerApi.listenerCount('message')).toBe(0)
})
