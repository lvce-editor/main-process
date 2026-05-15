import { beforeEach, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
})

jest.unstable_mockModule('electron', () => {
  return {
    BrowserWindow: {
      getFocusedWindow() {
        return {}
      },
    },
    dialog: {
      showMessageBox: jest.fn(),
    },
  }
})

jest.unstable_mockModule('../src/parts/Platform/Platform.ts', () => {
  return {
    applicationName: 'test-app',
    productNameLong: 'Test App',
  }
})

await import('../src/parts/ElectronDialog/ElectronDialog.ts')

test.todo('showMessageBox')
