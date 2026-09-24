import { beforeEach, expect, jest, test } from '@jest/globals'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const stat = jest.fn()

const rpc = {
  invoke: jest.fn(),
}
const focusedWindow = {
  focus: jest.fn(),
}

jest.unstable_mockModule('electron', () => ({
  BrowserWindow: {
    getAllWindows: jest.fn(() => [focusedWindow]),
    getFocusedWindow: jest.fn(() => focusedWindow),
  },
}))

jest.unstable_mockModule('../src/parts/AppWindowRpc/AppWindowRpc.ts', () => ({
  get: jest.fn(() => rpc),
  getLastFocusedWindow: jest.fn(),
}))

jest.unstable_mockModule('node:fs/promises', () => ({
  stat,
}))

const ReuseAppWindow = await import('../src/parts/ReuseAppWindow/ReuseAppWindow.ts')

beforeEach(() => {
  jest.clearAllMocks()
})

test('reuseAppWindow switches the focused window to a relative workspace', async () => {
  const reused = await ReuseAppWindow.reuseAppWindow({ _: ['../notebook'] }, '/workspace/project')

  expect(reused).toBe(true)
  expect(rpc.invoke).toHaveBeenCalledWith('Workspace.setUri', pathToFileURL(resolve('/workspace/project', '../notebook')).toString())
  expect(focusedWindow.focus).toHaveBeenCalledTimes(1)
})

test('reuseAppWindow returns false without a path', async () => {
  const reused = await ReuseAppWindow.reuseAppWindow({ _: [] }, '/workspace/project')

  expect(reused).toBe(false)
  expect(rpc.invoke).not.toHaveBeenCalled()
})

test('openFileInAppWindow opens a relative file in the focused window', async () => {
  stat.mockResolvedValue({ isFile: () => true })

  const opened = await ReuseAppWindow.openFileInAppWindow({ _: ['a file.heapsnapshot'] }, '/workspace/project')

  expect(opened).toBe(true)
  expect(rpc.invoke).toHaveBeenCalledWith('Main.openUri', pathToFileURL(resolve('/workspace/project', 'a file.heapsnapshot')).toString())
  expect(focusedWindow.focus).toHaveBeenCalledTimes(1)
})

test('openFileInAppWindow accepts an absolute file URL', async () => {
  stat.mockResolvedValue({ isFile: () => true })
  const fileUrl = pathToFileURL('/workspace/a file.heapsnapshot').toString()

  const opened = await ReuseAppWindow.openFileInAppWindow({ _: [fileUrl] }, '/other')

  expect(opened).toBe(true)
  expect(rpc.invoke).toHaveBeenCalledWith('Main.openUri', fileUrl)
})

test('openFileInAppWindow leaves folders to normal window startup', async () => {
  stat.mockResolvedValue({ isFile: () => false })

  const opened = await ReuseAppWindow.openFileInAppWindow({ _: ['/workspace/project'] }, '/workspace')

  expect(opened).toBe(false)
  expect(rpc.invoke).not.toHaveBeenCalled()
})

test('openFileInAppWindow preserves non-file URI startup handling', async () => {
  const opened = await ReuseAppWindow.openFileInAppWindow({ _: ['https://example.com'] }, '/workspace')

  expect(opened).toBe(false)
  expect(stat).not.toHaveBeenCalled()
  expect(rpc.invoke).not.toHaveBeenCalled()
})

test('openFileInAppWindow falls back when the existing window cannot open a file', async () => {
  stat.mockResolvedValue({ isFile: () => true })
  rpc.invoke.mockRejectedValue(new Error('window closed'))

  const opened = await ReuseAppWindow.openFileInAppWindow({ _: ['/workspace/file.txt'] }, '/workspace')

  expect(opened).toBe(false)
})
