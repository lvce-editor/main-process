import { beforeEach, expect, jest, test } from '@jest/globals'
import EventEmitter from 'node:events'

const browserWindows: any[] = []

jest.unstable_mockModule('electron', () => {
  class BrowserWindow extends EventEmitter {
    focus = jest.fn()
    loadURL = jest.fn()
    setMenuBarVisibility = jest.fn()

    constructor(public readonly options: Electron.BrowserWindowConstructorOptions) {
      super()
      browserWindows.push(this)
    }
  }

  return {
    BrowserWindow,
  }
})

const ElectronWindowGpuInfo = await import('../src/parts/ElectronWindowGpuInfo/ElectronWindowGpuInfo.ts')

beforeEach(() => {
  browserWindows.length = 0
  jest.clearAllMocks()
})

test('open', async () => {
  await ElectronWindowGpuInfo.open()

  expect(browserWindows).toHaveLength(1)
  expect(browserWindows[0].options).toEqual({
    height: 800,
    title: 'GPU Internals',
    webPreferences: {
      sandbox: true,
      spellcheck: false,
    },
    width: 1200,
  })
  expect(browserWindows[0].setMenuBarVisibility).toHaveBeenCalledTimes(1)
  expect(browserWindows[0].setMenuBarVisibility).toHaveBeenCalledWith(false)
  expect(browserWindows[0].loadURL).toHaveBeenCalledTimes(1)
  expect(browserWindows[0].loadURL).toHaveBeenCalledWith('chrome://gpu')

  await ElectronWindowGpuInfo.open()

  expect(browserWindows).toHaveLength(1)
  expect(browserWindows[0].focus).toHaveBeenCalledTimes(1)

  browserWindows[0].emit('closed')
  await ElectronWindowGpuInfo.open()

  expect(browserWindows).toHaveLength(2)
})
