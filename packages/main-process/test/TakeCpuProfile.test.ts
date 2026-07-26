import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let attached = false
let downloadsPath = ''
let mockWindow: any
let stopError: Error | undefined

const profile = {
  endTime: 10_000,
  nodes: [],
  samples: [],
  startTime: 0,
  timeDeltas: [],
}

const electronDebugger = {
  attach: jest.fn(() => {
    attached = true
  }),
  detach: jest.fn(() => {
    attached = false
  }),
  isAttached: jest.fn(() => attached),
  sendCommand: jest.fn(async (method: string, _parameters?: unknown, _sessionId?: string) => {
    switch (method) {
      case 'Page.getFrameTree':
        return { frameTree: { frame: { id: 'main-frame' } } }
      case 'Profiler.disable':
      case 'Profiler.enable':
      case 'Profiler.start':
      case 'Target.detachFromTarget':
        return {}
      case 'Profiler.stop':
        if (stopError) {
          throw stopError
        }
        return { profile }
      case 'Target.attachToTarget':
        return { sessionId: 'worker-session' }
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

const { takeWindowCpuProfile, takeWorkerCpuProfile } = await import('../src/parts/TakeCpuProfile/TakeCpuProfile.ts')

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
  jest.spyOn(Date, 'now').mockReturnValue(123_456)
  attached = false
  stopError = undefined
  downloadsPath = mkdtempSync(join(tmpdir(), 'lvce-cpu-profile-'))
  mockWindow = {
    webContents: {
      debugger: electronDebugger,
    },
  }
})

afterEach(() => {
  jest.useRealTimers()
  rmSync(downloadsPath, { force: true, recursive: true })
})

test('takes a ten second CPU profile of the extension host window', async () => {
  const resultPromise = takeWindowCpuProfile(7)
  await jest.advanceTimersByTimeAsync(10_000)
  const result = await resultPromise

  expect(result).toBe(join(downloadsPath, 'Extension-Host-Window-7-123456.cpuprofile'))
  expect(JSON.parse(readFileSync(result, 'utf8'))).toEqual(profile)
  expect(electronDebugger.sendCommand).toHaveBeenNthCalledWith(1, 'Profiler.enable', undefined, undefined)
  expect(electronDebugger.sendCommand).toHaveBeenNthCalledWith(2, 'Profiler.start', undefined, undefined)
  expect(electronDebugger.sendCommand).toHaveBeenNthCalledWith(3, 'Profiler.stop', undefined, undefined)
  expect(electronDebugger.sendCommand).toHaveBeenNthCalledWith(4, 'Profiler.disable', undefined, undefined)
  expect(electronDebugger.attach).toHaveBeenCalledTimes(1)
  expect(electronDebugger.detach).toHaveBeenCalledTimes(1)
})

test('takes a ten second CPU profile of the named extension worker', async () => {
  const resultPromise = takeWorkerCpuProfile(7, 'Extension API (Electron): sample.extension')
  await jest.advanceTimersByTimeAsync(10_000)
  const result = await resultPromise

  expect(result).toBe(join(downloadsPath, 'Extension-API-Electron-sample.extension-123456.cpuprofile'))
  expect(JSON.parse(readFileSync(result, 'utf8'))).toEqual(profile)
  expect(electronDebugger.sendCommand).toHaveBeenNthCalledWith(1, 'Page.getFrameTree')
  expect(electronDebugger.sendCommand).toHaveBeenNthCalledWith(2, 'Target.getTargets')
  expect(electronDebugger.sendCommand).toHaveBeenNthCalledWith(3, 'Target.attachToTarget', {
    flatten: true,
    targetId: 'worker-target',
  })
  expect(electronDebugger.sendCommand).toHaveBeenNthCalledWith(4, 'Profiler.enable', undefined, 'worker-session')
  expect(electronDebugger.sendCommand).toHaveBeenNthCalledWith(5, 'Profiler.start', undefined, 'worker-session')
  expect(electronDebugger.sendCommand).toHaveBeenNthCalledWith(6, 'Profiler.stop', undefined, 'worker-session')
  expect(electronDebugger.sendCommand).toHaveBeenNthCalledWith(7, 'Profiler.disable', undefined, 'worker-session')
  expect(electronDebugger.sendCommand).toHaveBeenNthCalledWith(8, 'Target.detachFromTarget', { sessionId: 'worker-session' })
})

test('reuses an attached debugger', async () => {
  attached = true

  const resultPromise = takeWindowCpuProfile(7)
  await jest.advanceTimersByTimeAsync(10_000)
  await resultPromise

  expect(electronDebugger.attach).not.toHaveBeenCalled()
  expect(electronDebugger.detach).not.toHaveBeenCalled()
})

test('throws when the browser window does not exist', async () => {
  mockWindow = undefined

  await expect(takeWindowCpuProfile(7)).rejects.toThrow('Browser window not found: 7')
  expect(electronDebugger.attach).not.toHaveBeenCalled()
})

test('throws when the worker does not exist', async () => {
  electronDebugger.sendCommand.mockResolvedValueOnce({ frameTree: { frame: { id: 'main-frame' } } }).mockResolvedValueOnce({ targetInfos: [] })

  await expect(takeWorkerCpuProfile(7, 'Extension API (Electron): missing.extension')).rejects.toThrow(
    'Worker not found: Extension API (Electron): missing.extension',
  )
  expect(electronDebugger.detach).toHaveBeenCalledTimes(1)
})

test('does not leave a profile file when profiling fails', async () => {
  stopError = new Error('Profiling failed')

  let profileError: unknown
  const takeProfile = async (): Promise<void> => {
    try {
      await takeWindowCpuProfile(7)
    } catch (error) {
      profileError = error
    }
  }
  const resultPromise = takeProfile()
  await jest.advanceTimersByTimeAsync(10_000)
  await resultPromise

  expect(profileError).toEqual(new Error('Profiling failed'))
  expect(readdirSync(downloadsPath)).toEqual([])
})
