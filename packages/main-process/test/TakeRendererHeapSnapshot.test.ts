import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { EventEmitter } from 'node:events'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const emitter = new EventEmitter()
let attached = false
let downloadsPath = ''
let windows: readonly any[] = []
let views: readonly any[] = []
let snapshotError: Error | undefined

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
  sendCommand: jest.fn(async (method: string, _parameters?: unknown) => {
    if (method === 'HeapProfiler.takeHeapSnapshot') {
      emitter.emit('message', {}, 'HeapProfiler.addHeapSnapshotChunk', { chunk: '{"snapshot":{}}' })
      if (snapshotError) {
        throw snapshotError
      }
    }
    return {}
  }),
}

jest.unstable_mockModule('electron', () => ({
  app: {
    getPath: jest.fn(() => downloadsPath),
  },
  BrowserWindow: {
    getAllWindows: jest.fn(() => windows),
  },
}))

jest.unstable_mockModule('../src/parts/ElectronWebContentsViewState/ElectronWebContentsViewState.ts', () => ({
  getAll: jest.fn(() => views),
}))

const { takeRendererHeapSnapshot } = await import('../src/parts/TakeRendererHeapSnapshot/TakeRendererHeapSnapshot.ts')

const createWebContents = (pid: number, destroyed = false) => ({
  debugger: electronDebugger,
  getOSProcessId: () => pid,
  isDestroyed: () => destroyed,
})

beforeEach(() => {
  jest.clearAllMocks()
  emitter.removeAllListeners()
  attached = false
  downloadsPath = mkdtempSync(join(tmpdir(), 'lvce-renderer-heap-snapshot-'))
  windows = [{ webContents: createWebContents(123) }]
  views = []
  snapshotError = undefined
})

afterEach(() => {
  rmSync(downloadsPath, { force: true, recursive: true })
})

test('takes a snapshot of a browser window renderer', async () => {
  jest.spyOn(Date, 'now').mockReturnValue(123456)

  const result = await takeRendererHeapSnapshot(123)

  expect(result).toBe(pathToFileURL(join(downloadsPath, 'renderer-123-123456.heapsnapshot')).href)
  expect(JSON.parse(readFileSync(fileURLToPath(result), 'utf8'))).toEqual({ snapshot: {} })
  expect(electronDebugger.sendCommand).toHaveBeenNthCalledWith(1, 'HeapProfiler.enable')
  expect(electronDebugger.sendCommand).toHaveBeenNthCalledWith(2, 'HeapProfiler.takeHeapSnapshot', { reportProgress: false })
  expect(electronDebugger.attach).toHaveBeenCalledTimes(1)
  expect(electronDebugger.detach).toHaveBeenCalledTimes(1)
})

test('takes a snapshot of a web contents view renderer', async () => {
  windows = []
  views = [{ view: { webContents: createWebContents(456) } }]

  await expect(takeRendererHeapSnapshot(456)).resolves.toContain('renderer-456-')
})

test('throws when the renderer is missing or destroyed', async () => {
  await expect(takeRendererHeapSnapshot(999)).rejects.toThrow('Renderer process not found: 999')
  windows = [{ webContents: createWebContents(123, true) }]
  await expect(takeRendererHeapSnapshot(123)).rejects.toThrow('Renderer process was destroyed: 123')
})

test('removes an incomplete snapshot when capture fails', async () => {
  snapshotError = new Error('Snapshot failed')

  await expect(takeRendererHeapSnapshot(123)).rejects.toThrow('Snapshot failed')
  expect(readdirSync(downloadsPath)).toEqual([])
})
