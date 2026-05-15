import { beforeEach, jest, test } from '@jest/globals'
import EventEmitter from 'node:events'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

jest.unstable_mockModule('electron', () => {
  const BrowserWindow = class extends EventEmitter {
    constructor() {
      super()
      // @ts-ignore
      this.webContents = {
        id: 1,
      }
    }
  }
  // @ts-ignore
  BrowserWindow.prototype.loadURL = jest.fn()
  // @ts-ignore
  BrowserWindow.prototype.setMenuBarVisibility = jest.fn()
  // @ts-ignore
  BrowserWindow.prototype.setAutoHideMenuBar = jest.fn()
  return {
    BrowserWindow,
    Menu: class {},
    MessageChannelMain: class {},
    net: {},
    screen: {
      getPrimaryDisplay() {
        return {
          bounds: {
            height: 10,
            width: 10,
          },
        }
      },
    },
    session: {
      fromPartition() {
        return {
          protocol: {
            handle() {},
            registerFileProtocol() {},
          },
          setPermissionCheckHandler() {},
          setPermissionRequestHandler() {},
          webRequest: {
            onHeadersReceived() {},
          },
        }
      },
    },
  }
})

await import('../src/parts/AppWindow/AppWindow.ts')

test.todo('createAppWindow')

test.todo('createAppWindow - error')
