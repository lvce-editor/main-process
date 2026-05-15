import { jest, test } from '@jest/globals'

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

await import('../src/parts/App/App.ts')

test.todo('handlePortForMainProcess - error - command not found')
