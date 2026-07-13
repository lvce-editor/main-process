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

const CreatePidMap = await import('../src/parts/CreatePidMap/CreatePidMap.ts')
const UtilityProcessState = await import('../src/parts/UtilityProcessState/UtilityProcessState.ts')
const electron = await import('electron')

beforeEach(() => {
  UtilityProcessState.state.all = Object.create(null)
})

test('createPidMap - detect chrome devtools', () => {
  // @ts-expect-error
  electron.BrowserWindow.getAllWindows.mockImplementation(() => {
    return [
      {
        getBrowserViews() {
          return []
        },
        webContents: {
          devToolsWebContents: {
            getOSProcessId() {
              return 200_152
            },
          },
          getOSProcessId() {
            return 123
          },
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
        getBrowserViews() {
          return []
        },
        webContents: {
          getOSProcessId() {
            return 200_152
          },
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

test('createPidMap - utility process', () => {
  // @ts-expect-error
  electron.BrowserWindow.getAllWindows.mockReturnValue([])
  UtilityProcessState.add(123, {}, 'file-system-process')

  expect(CreatePidMap.createPidMap()).toEqual({
    123: 'file-system-process',
  })
})
