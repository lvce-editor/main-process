import { expect, jest, test } from '@jest/globals'
import { create } from '../src/parts/WorkerMemoryConnection/WorkerMemoryConnection.ts'

const fixture = (initiallyAttached = false) => {
  let attached = initiallyAttached
  let sequence = 0
  const debuggerApi = {
    attach: jest.fn(() => {
      attached = true
    }),
    detach: jest.fn(() => {
      attached = false
    }),
    isAttached: () => attached,
    sendCommand: jest.fn<(...args: any[]) => Promise<any>>(async (method, params, sessionId) => {
      switch (method) {
        case 'Page.getFrameTree':
          return { frameTree: { frame: { id: 'frame' } } }
        case 'Runtime.evaluate':
          return { result: { value: `Worker ${sessionId}` } }
        case 'Runtime.getHeapUsage':
          return { totalSize: 2048, usedSize: 1024 }
        case 'Target.attachToTarget':
          return { sessionId: params.targetId === 'frame' ? 'frame-root' : `${params.targetId}-${++sequence}` }
        case 'Target.detachFromTarget':
        case 'Target.setAutoAttach':
          return {}
        case 'Target.getTargets':
          return {
            targetInfos: [
              { parentFrameId: 'frame', targetId: 'a', type: 'worker' },
              { parentFrameId: 'frame', targetId: 'b', type: 'worker' },
              { parentFrameId: 'other', targetId: 'foreign', type: 'worker' },
            ],
          }
        default:
          throw new Error(method)
      }
    }),
  }
  const webContents = { debugger: debuggerApi } as unknown as Electron.WebContents
  return { debuggerApi, webContents }
}

test('evaluates each name once and reuses sessions across batched heap queries', async () => {
  const { debuggerApi, webContents } = fixture()
  const connection = create(webContents)
  expect(await connection.execute('WorkerMemory.getTargets')).toEqual(['a', 'b'])
  const sessions = (await connection.execute('WorkerMemory.attach', ['a', 'b'])) as any[]
  expect(sessions).toEqual([
    { runtimeName: 'Worker a-1', sessionId: 'a-1', targetId: 'a' },
    { runtimeName: 'Worker b-2', sessionId: 'b-2', targetId: 'b' },
  ])
  for (let i = 0; i < 3; i++) {
    expect(await connection.execute('WorkerMemory.getHeapUsages', ['a-1', 'b-2'])).toEqual([
      { totalSize: 2048, usedSize: 1024 },
      { totalSize: 2048, usedSize: 1024 },
    ])
  }
  expect(debuggerApi.sendCommand.mock.calls.filter(([method]) => method === 'Runtime.evaluate')).toHaveLength(2)
  expect(debuggerApi.attach).toHaveBeenCalledTimes(1)
  expect(debuggerApi.detach).not.toHaveBeenCalled()
  await connection.dispose()
  await connection.dispose()
  expect(debuggerApi.detach).toHaveBeenCalledTimes(1)
  expect(debuggerApi.sendCommand.mock.calls.filter(([method]) => method === 'Target.detachFromTarget')).toHaveLength(3)
  await expect(connection.execute('WorkerMemory.getTargets')).rejects.toThrow('closed')
})

test('does not attach foreign targets or query sessions belonging to another connection', async () => {
  const { debuggerApi, webContents } = fixture()
  const first = create(webContents)
  const second = create(webContents)
  expect(await first.execute('WorkerMemory.attach', ['foreign'])).toEqual([null])
  await first.execute('WorkerMemory.attach', ['a'])
  expect(await second.execute('WorkerMemory.getHeapUsages', ['a-1'])).toEqual([null])
  await second.execute('WorkerMemory.detach', ['a-1'])
  expect(debuggerApi.sendCommand).not.toHaveBeenCalledWith('Target.detachFromTarget', { sessionId: 'a-1' })
  await first.dispose()
  expect(debuggerApi.detach).not.toHaveBeenCalled()
  await second.dispose()
  expect(debuggerApi.detach).toHaveBeenCalledTimes(1)
})

test('preserves a debugger attached by another feature', async () => {
  const { debuggerApi, webContents } = fixture(true)
  const connection = create(webContents)
  await connection.execute('WorkerMemory.attach', ['a'])
  await connection.dispose()
  expect(debuggerApi.attach).not.toHaveBeenCalled()
  expect(debuggerApi.detach).not.toHaveBeenCalled()
})

test('cleans up a target attachment that completes after the connection closes', async () => {
  const { debuggerApi, webContents } = fixture(true)
  const connection = create(webContents)
  const pending = Promise.withResolvers<any>()
  const original = debuggerApi.sendCommand.getMockImplementation()!
  debuggerApi.sendCommand.mockImplementation(async (...args) =>
    args[0] === 'Target.attachToTarget' && args[1].targetId === 'a' ? pending.promise : original(...args),
  )
  const request = connection.execute('WorkerMemory.attach', ['a'])
  await new Promise((resolve) => setImmediate(resolve))
  await connection.dispose()
  pending.resolve({ sessionId: 'late-session' })
  expect(await request).toEqual([null])
  expect(debuggerApi.sendCommand).toHaveBeenCalledWith('Target.detachFromTarget', { sessionId: 'late-session' })
  expect(debuggerApi.sendCommand.mock.calls.filter(([method]) => method === 'Runtime.evaluate')).toHaveLength(0)
})

test('isolates failed measurements and releases removed sessions', async () => {
  const { debuggerApi, webContents } = fixture()
  const connection = create(webContents)
  await connection.execute('WorkerMemory.attach', ['a', 'b'])
  const original = debuggerApi.sendCommand.getMockImplementation()!
  debuggerApi.sendCommand.mockImplementation(async (...args) => {
    if (args[0] === 'Runtime.getHeapUsage' && args[2] === 'a-1') throw new Error('target closed')
    return original(...args)
  })
  expect(await connection.execute('WorkerMemory.getHeapUsages', ['a-1', 'b-2'])).toEqual([null, { totalSize: 2048, usedSize: 1024 }])
  await connection.execute('WorkerMemory.detach', ['a-1'])
  await connection.dispose()
  expect(debuggerApi.sendCommand.mock.calls.filter(([method]) => method === 'Target.detachFromTarget')).toHaveLength(3)
})

test('an old connection cannot detach a replacement debugger after an external detach', async () => {
  const { debuggerApi, webContents } = fixture()
  const first = create(webContents)
  debuggerApi.detach()
  const second = create(webContents)
  await first.dispose()
  expect(debuggerApi.isAttached()).toBe(true)
  await second.dispose()
  expect(debuggerApi.isAttached()).toBe(false)
  expect(debuggerApi.attach).toHaveBeenCalledTimes(2)
})
