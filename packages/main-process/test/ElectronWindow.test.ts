import { beforeEach, expect, jest, test } from '@jest/globals'

let mockWindow: any = undefined

jest.unstable_mockModule('electron', () => {
  return {
    BrowserWindow: {
      fromId: jest.fn((windowId: number) => {
        if (!mockWindow || mockWindow.id !== windowId) {
          return undefined
        }
        return mockWindow
      }),
      getFocusedWindow: jest.fn(() => undefined),
    },
  }
})

const electron = await import('electron')
const ElectronWindow = await import('../src/parts/ElectronWindow/ElectronWindow.js')

beforeEach(() => {
  jest.resetAllMocks()
  mockWindow = undefined
  // @ts-expect-error
  electron.BrowserWindow.fromId.mockImplementation((windowId: number) => {
    if (!mockWindow || mockWindow.id !== windowId) {
      return undefined
    }
    return mockWindow
  })
  // @ts-expect-error
  electron.BrowserWindow.getFocusedWindow.mockImplementation(() => undefined)
})

test('executeWindowFunction - toggleDevtools - no window', () => {
  expect(ElectronWindow.executeWindowFunction(1, 'toggleDevtools')).toBeUndefined()
})

test('executeWindowFunction - toggleDevtools - closes when already open', () => {
  const pageWebContents = {
    closeDevTools: jest.fn(),
    isDevToolsOpened: jest.fn(() => true),
    once: jest.fn(),
    openDevTools: jest.fn(),
  }
  mockWindow = {
    id: 1,
    webContents: pageWebContents,
  }

  ElectronWindow.executeWindowFunction(1, 'toggleDevtools')

  expect(pageWebContents.closeDevTools).toHaveBeenCalledTimes(1)
  expect(pageWebContents.openDevTools).not.toHaveBeenCalled()
})

test('executeWindowFunction - toggleDevtools - opens and closes from focused devtools shortcut', () => {
  let devtoolsClosedListener: any = undefined
  let devtoolsBeforeInputListener: any = undefined
  let devtoolsDestroyedListener: any = undefined

  const devtoolsWebContents = {
    off: jest.fn(),
    on: jest.fn((event: string, listener: any) => {
      if (event === 'before-input-event') {
        devtoolsBeforeInputListener = listener
      }
    }),
    once: jest.fn((event: string, listener: any) => {
      if (event === 'destroyed') {
        devtoolsDestroyedListener = listener
      }
    }),
  }
  const pageWebContents = {
    closeDevTools: jest.fn(),
    devToolsWebContents: devtoolsWebContents,
    isDevToolsOpened: jest.fn(() => false),
    once: jest.fn((event: string, listener: any) => {
      if (event === 'devtools-closed') {
        devtoolsClosedListener = listener
      }
    }),
    openDevTools: jest.fn(),
  }
  mockWindow = {
    id: 1,
    webContents: pageWebContents,
  }

  ElectronWindow.executeWindowFunction(1, 'toggleDevtools')

  expect(pageWebContents.openDevTools).toHaveBeenCalledTimes(1)
  expect(devtoolsWebContents.on).toHaveBeenCalledTimes(1)
  expect(devtoolsWebContents.on).toHaveBeenCalledWith('before-input-event', expect.any(Function))
  expect(devtoolsClosedListener).toEqual(expect.any(Function))
  expect(devtoolsDestroyedListener).toEqual(expect.any(Function))

  const event = {
    preventDefault: jest.fn(),
  }

  devtoolsBeforeInputListener(event, {
    code: 'KeyI',
    control: true,
    key: 'I',
    meta: false,
    shift: true,
    type: 'keyDown',
  })

  expect(event.preventDefault).toHaveBeenCalledTimes(1)
  expect(pageWebContents.closeDevTools).toHaveBeenCalledTimes(1)

  devtoolsClosedListener()

  expect(devtoolsWebContents.off).toHaveBeenCalledTimes(1)
  expect(devtoolsWebContents.off).toHaveBeenCalledWith('before-input-event', devtoolsBeforeInputListener)
})

test('executeWindowFunction - toggleDevtools - does not add duplicate devtools listeners', () => {
  const devtoolsWebContents = {
    off: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
  }
  const pageWebContents = {
    closeDevTools: jest.fn(),
    devToolsWebContents: devtoolsWebContents,
    isDevToolsOpened: jest.fn(() => false),
    once: jest.fn(),
    openDevTools: jest.fn(),
  }
  mockWindow = {
    id: 1,
    webContents: pageWebContents,
  }

  ElectronWindow.executeWindowFunction(1, 'toggleDevtools')
  ElectronWindow.executeWindowFunction(1, 'toggleDevtools')

  expect(devtoolsWebContents.on).toHaveBeenCalledTimes(1)
})

test('executeWindowFunction - toggleDevtools - waits for devtools-opened when devtools webcontents are not ready yet', () => {
  let devtoolsOpenedListener: any = undefined
  let devtoolsBeforeInputListener: any = undefined

  const devtoolsWebContents = {
    off: jest.fn(),
    on: jest.fn((event: string, listener: any) => {
      if (event === 'before-input-event') {
        devtoolsBeforeInputListener = listener
      }
    }),
    once: jest.fn(),
  }
  const pageWebContents: any = {
    closeDevTools: jest.fn(),
    devToolsWebContents: undefined,
    isDevToolsOpened: jest.fn(() => false),
    once: jest.fn((event: string, listener: any) => {
      if (event === 'devtools-opened') {
        devtoolsOpenedListener = listener
      }
    }),
    openDevTools: jest.fn(),
  }
  mockWindow = {
    id: 1,
    webContents: pageWebContents,
  }

  ElectronWindow.executeWindowFunction(1, 'toggleDevtools')

  expect(pageWebContents.once).toHaveBeenCalledWith('devtools-opened', expect.any(Function))
  expect(devtoolsOpenedListener).toEqual(expect.any(Function))

  pageWebContents.devToolsWebContents = devtoolsWebContents
  devtoolsOpenedListener()

  expect(devtoolsWebContents.on).toHaveBeenCalledWith('before-input-event', expect.any(Function))

  const event = {
    preventDefault: jest.fn(),
  }

  devtoolsBeforeInputListener(event, {
    code: 'KeyI',
    control: true,
    key: 'I',
    meta: false,
    shift: true,
    type: 'keyDown',
  })

  expect(event.preventDefault).toHaveBeenCalledTimes(1)
  expect(pageWebContents.closeDevTools).toHaveBeenCalledTimes(1)
})
