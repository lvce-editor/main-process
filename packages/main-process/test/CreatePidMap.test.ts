import { beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.restoreAllMocks()
  jest.resetModules()
  jest.resetAllMocks()
})

jest.unstable_mockModule('electron', () => {
  return {
    BrowserWindow: {
      getAllWindows: jest.fn(() => {
        throw new Error('not implemented')
      }),
    },
  }
})

const CreatePidMap = await import('../src/parts/CreatePidMap/CreatePidMap.js')
const electron = await import('electron')

test('createPidMap - detect chrome devtools', () => {
  // @ts-expect-error
  electron.BrowserWindow.getAllWindows.mockImplementation(() => {
    return [
      {
        webContents: {
          getOSProcessId() {
            return 123
          },
          devToolsWebContents: {
            getOSProcessId() {
              return 200_152
            },
          },
        },
        getBrowserViews() {
          return []
        },
      },
    ]
  })
  expect(CreatePidMap.createPidMap()).toEqual({ 123: 'renderer', 200_152: 'chrome-devtools' })
})

test('createPidMap - detect renderer', () => {
  // @ts-expect-error
  electron.BrowserWindow.getAllWindows.mockImplementation(() => {
    return [
      {
        webContents: {
          getOSProcessId() {
            return 200_152
          },
        },
        getBrowserViews() {
          return []
        },
      },
    ]
  })
  expect(CreatePidMap.createPidMap()).toEqual({
    200_152: 'renderer',
  })
})

test('createPidMap - unknown renderer', () => {
  // @ts-expect-error
  electron.BrowserWindow.getAllWindows.mockImplementation(() => {
    return []
  })
  expect(CreatePidMap.createPidMap()).toEqual({})
})
