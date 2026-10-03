import { expect, jest, test } from '@jest/globals'

const getThreads = jest.fn<(...args: any[]) => Promise<ReadonlyMap<string, { pid: number; tid: number }>>>()
const readFile = jest.fn<(...args: any[]) => Promise<string>>()
const promisify = jest.fn(() => async () => ({ stdout: '100' }))

jest.unstable_mockModule('node:fs/promises', () => ({ readFile }))
jest.unstable_mockModule('node:util', () => ({ promisify }))
jest.unstable_mockModule('../src/parts/WorkerThreadIds/WorkerThreadIds.ts', () => ({ get: getThreads }))

const { create } = await import('../src/parts/WorkerCpu/WorkerCpu.ts')

const zero = (): string => '0'

const stat = () => {
  const fields = Array.from({ length: 20 }, zero)
  fields[11] = '0'
  fields[12] = '0'
  fields[19] = '123'
  return `42 (worker) ${fields.join(' ')}`
}

test('retries worker thread discovery after a transient trace failure', async () => {
  const platform = Object.getOwnPropertyDescriptor(process, 'platform')!
  Object.defineProperty(process, 'platform', { ...platform, value: 'linux' })
  getThreads.mockResolvedValueOnce(new Map()).mockResolvedValue(new Map([['target', { pid: 123, tid: 456 }]]))
  readFile.mockResolvedValue(stat())
  const debuggerApi = { isAttached: () => true }
  const webContents = { debugger: debuggerApi, getOSProcessId: () => 123 } as unknown as Electron.WebContents
  const cpu = create(webContents)
  try {
    expect(await cpu.get(['target'])).toEqual([null])
    expect(await cpu.get(['target'])).toEqual([null])
    expect(await cpu.get(['target'])).toEqual([0])
    expect(getThreads).toHaveBeenCalledTimes(2)
  } finally {
    await cpu.dispose()
    Object.defineProperty(process, 'platform', platform)
    jest.clearAllMocks()
  }
})
