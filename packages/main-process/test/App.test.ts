import { expect, jest, test } from '@jest/globals'

jest.unstable_mockModule('electron', () => {
  return {
    app: {
      name: '',
    },
    ApplicationMenu: class {},
    BrowserWindow: class {},
    ipcMain: {},
    Menu: class {},
    MessageChannelMain: class {},
    net: {},
    screen: {},
    shell: {},
  }
})

jest.unstable_mockModule('electron-unhandled', () => {
  return {
    default() {},
  }
})

const App = await import('../src/parts/App/App.js')

test.skip('handlePortForMainProcess - error - command not found', async () => {
  let _listener = async (message) => {}
  const port = {
    _listeners: Object.create(null),
    on(event, listener) {
      _listener = listener
    },
    postMessage: jest.fn(),
    start() {},
  }
  const event = {
    ports: [port],
  }

  // @ts-expect-error
  App.handlePortForMainProcess(event)
  await _listener({
    data: {
      id: 1,
      jsonrpc: '2.0',
      method: 'App.exit',
      params: [],
    },
  })
  expect(port.postMessage).toHaveBeenCalledTimes(1)
  expect(port.postMessage).toHaveBeenCalledWith({
    error: {
      code: -32_001,
      data: expect.stringMatching('Error: method not found App.exit'),
      message: 'method not found App.exit',
    },
    id: 1,
    jsonrpc: '2.0',
  })
})
