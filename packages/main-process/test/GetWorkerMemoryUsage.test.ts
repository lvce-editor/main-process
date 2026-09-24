import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'

let attached = false
let mockWindow: any
let runtimeNames = new Map<string, string>()

const debuggerApi = {
  attach: jest.fn(() => {
    attached = true
  }),
  detach: jest.fn(() => {
    attached = false
  }),
  isAttached: jest.fn(() => attached),
  sendCommand: jest.fn(async (method: string, parameters?: any, sessionId?: string) => {
    switch (method) {
      case 'Page.getFrameTree':
        return { frameTree: { frame: { id: 'frame-1' } } }
      case 'Target.getTargets':
        return {
          targetInfos: [
            { parentFrameId: 'frame-1', targetId: 'worker-a', type: 'worker' },
            { parentFrameId: 'frame-1', targetId: 'worker-b', type: 'worker' },
            { parentFrameId: 'other-frame', targetId: 'other-window', type: 'worker' },
          ],
        }
      case 'Target.attachToTarget':
        return { sessionId: `${parameters.targetId}-session` }
      case 'Runtime.evaluate':
        return { result: { value: runtimeNames.get(sessionId!) } }
      case 'Runtime.getHeapUsage':
        return { usedSize: 1234, totalSize: 2048 }
      case 'Target.detachFromTarget':
        return {}
      default:
        throw new Error(`Unexpected command: ${method}`)
    }
  }),
}

jest.unstable_mockModule('electron', () => ({
  BrowserWindow: {
    fromId: jest.fn(() => mockWindow),
  },
}))

const { getWorkerMemoryUsage } = await import('../src/parts/GetWorkerMemoryUsage/GetWorkerMemoryUsage.ts')

beforeEach(() => {
  mockWindow = { webContents: { debugger: debuggerApi } }
})

afterEach(() => {
  jest.clearAllMocks()
  attached = false
  runtimeNames = new Map()
})

test('matches a unique runtime name when workers have duplicate target titles', async () => {
  runtimeNames.set('worker-a-session', 'Editor Worker [worker-1]')
  runtimeNames.set('worker-b-session', 'Editor Worker [worker-2]')

  const result = await getWorkerMemoryUsage(7, 'Editor Worker [worker-2]')

  expect(result).toEqual({ usedSize: 1234, totalSize: 2048 })
  expect(debuggerApi.sendCommand).toHaveBeenCalledWith('Runtime.evaluate', {
    expression: 'self.name',
    returnByValue: true,
  }, 'worker-b-session')
  expect(debuggerApi.sendCommand).toHaveBeenCalledWith('Runtime.getHeapUsage', undefined, 'worker-b-session')
  expect(debuggerApi.detach).toHaveBeenCalledTimes(1)
})

test('returns unavailable when the target is gone', async () => {
  const result = await getWorkerMemoryUsage(7, 'missing-worker')
  expect(result).toBeNull()
})

test('does not detach a debugger session owned by another feature', async () => {
  attached = true
  runtimeNames.set('worker-a-session', 'Editor Worker [worker-1]')

  await getWorkerMemoryUsage(7, 'Editor Worker [worker-1]')

  expect(debuggerApi.attach).not.toHaveBeenCalled()
  expect(debuggerApi.detach).not.toHaveBeenCalled()
})
