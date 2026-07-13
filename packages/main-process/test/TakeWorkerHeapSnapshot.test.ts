import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { EventEmitter } from 'node:events'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let attached = false
let downloadsPath = ''
let mockWindow: any
let takeSnapshotError: Error | undefined

const emitter = new EventEmitter()
const electronDebugger = {
  attach: jest.fn(() => {
    attached = true
  }),
  detach: jest.fn(() => {
    attached = false
  }),
  isAttached: jest.fn(() => attached),
  off: jest.fn((event: string, listener: (...args: readonly any[]) => void) => {
    emitter.off(event, listener)
  }),
  on: jest.fn((event: string, listener: (...args: readonly any[]) => void) => {
    emitter.on(event, listener)
  }),
  sendCommand: jest.fn(async (method: string, _parameters?: any, sessionId?: string) => {
    switch (method) {
      case 'HeapProfiler.enable':
        return {}
      case 'HeapProfiler.takeHeapSnapshot':
        emitter.emit('message', {}, 'Runtime.consoleAPICalled', {}, sessionId)
        emitter.emit('message', {}, 'HeapProfiler.addHeapSnapshotChunk', { chunk: 'ignored' }, 'other-session')
        emitter.emit('message', {}, 'HeapProfiler.addHeapSnapshotChunk', { chunk: '{"snapshot":' }, sessionId)
        emitter.emit('message', {}, 'HeapProfiler.addHeapSnapshotChunk', { chunk: '{}}' }, sessionId)
        if (takeSnapshotError) {
          throw takeSnapshotError
        }
        return {}
      case 'Page.getFrameTree':
        return { frameTree: { frame: { id: 'main-frame' } } }
      case 'Target.attachToTarget':
        return { sessionId: 'worker-session' }
      case 'Target.detachFromTarget':
        return {}
      case 'Target.getTargets':
        return {
          targetInfos: [
            { targetId: 'page-target', title: 'Lvce Editor', type: 'page' },
            {
              parentFrameId: 'other-frame',
              targetId: 'other-worker-target',
              title: 'Extension API (Electron): sample.extension',
              type: 'worker',
            },
            {
              parentFrameId: 'main-frame',
              targetId: 'worker-target',
              title: 'Extension API (Electron): sample.extension',
              type: 'worker',
            },
          ],
        }
      default:
        throw new Error(`Unexpected command: ${method}`)
    }
  }),
}

jest.unstable_mockModule('electron', () => ({
  app: {
    getPath: jest.fn(() => downloadsPath),
  },
  BrowserWindow: {
    fromId: jest.fn(() => mockWindow),
  },
}))

const { takeWorkerHeapSnapshot } = await import('../src/parts/TakeWorkerHeapSnapshot/TakeWorkerHeapSnapshot.ts')

beforeEach(() => {
  jest.clearAllMocks()
  emitter.removeAllListeners()
  attached = false
  takeSnapshotError = undefined
  downloadsPath = mkdtempSync(join(tmpdir(), 'lvce-worker-heap-snapshot-'))
  mockWindow = {
    webContents: {
      debugger: electronDebugger,
    },
  }
})

afterEach(() => {
  rmSync(downloadsPath, { force: true, recursive: true })
})

test('takes a heap snapshot for the named worker', async () => {
  jest.spyOn(Date, 'now').mockReturnValue(123_456)

  const result = await takeWorkerHeapSnapshot(7, 'Extension API (Electron): sample.extension')

  expect(result).toBe(join(downloadsPath, 'Extension-API-Electron-sample.extension-123456.heapsnapshot'))
  expect(readFileSync(result, 'utf8')).toBe('{"snapshot":{}}')
  expect(electronDebugger.sendCommand).toHaveBeenNthCalledWith(1, 'Page.getFrameTree')
  expect(electronDebugger.sendCommand).toHaveBeenNthCalledWith(2, 'Target.getTargets')
  expect(electronDebugger.sendCommand).toHaveBeenNthCalledWith(3, 'Target.attachToTarget', {
    flatten: true,
    targetId: 'worker-target',
  })
  expect(electronDebugger.sendCommand).toHaveBeenNthCalledWith(4, 'HeapProfiler.enable', undefined, 'worker-session')
  expect(electronDebugger.sendCommand).toHaveBeenNthCalledWith(
    5,
    'HeapProfiler.takeHeapSnapshot',
    { reportProgress: false },
    'worker-session',
  )
  expect(electronDebugger.sendCommand).toHaveBeenNthCalledWith(6, 'Target.detachFromTarget', { sessionId: 'worker-session' })
  expect(electronDebugger.attach).toHaveBeenCalledTimes(1)
  expect(electronDebugger.detach).toHaveBeenCalledTimes(1)
})

test('reuses an attached debugger', async () => {
  attached = true

  await takeWorkerHeapSnapshot(7, 'Extension API (Electron): sample.extension')

  expect(electronDebugger.attach).not.toHaveBeenCalled()
  expect(electronDebugger.detach).not.toHaveBeenCalled()
})

test('throws when the browser window does not exist', async () => {
  mockWindow = undefined

  await expect(takeWorkerHeapSnapshot(7, 'Extension API (Electron): sample.extension')).rejects.toThrow('Browser window not found: 7')
  expect(electronDebugger.attach).not.toHaveBeenCalled()
})

test('throws when the worker does not exist', async () => {
  electronDebugger.sendCommand.mockResolvedValueOnce({ frameTree: { frame: { id: 'main-frame' } } }).mockResolvedValueOnce({ targetInfos: [] })

  await expect(takeWorkerHeapSnapshot(7, 'Extension API (Electron): missing.extension')).rejects.toThrow(
    'Worker not found: Extension API (Electron): missing.extension',
  )
  expect(electronDebugger.detach).toHaveBeenCalledTimes(1)
})

test('removes an incomplete snapshot', async () => {
  takeSnapshotError = new Error('Snapshot failed')

  await expect(takeWorkerHeapSnapshot(7, 'Extension API (Electron): sample.extension')).rejects.toThrow('Snapshot failed')
  expect(readdirSync(downloadsPath)).toEqual([])
})
