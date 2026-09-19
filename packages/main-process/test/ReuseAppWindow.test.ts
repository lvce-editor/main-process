import { beforeEach, expect, jest, test } from '@jest/globals'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

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
