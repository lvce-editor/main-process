import { beforeEach, expect, jest, test } from '@jest/globals'
import { pathToFileURL } from 'node:url'

beforeEach(() => {
  jest.clearAllMocks()
  jest.resetModules()
})

jest.unstable_mockModule('electron', () => {
  return {
    BrowserWindow: {
      getFocusedWindow: jest.fn(() => ({})),
    },
    dialog: {
      showOpenDialog: jest.fn(),
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

const Electron = await import('electron')
const ElectronDialog = await import('../src/parts/ElectronDialog/ElectronDialog.ts')

test.todo('showMessageBox')

test.each(['/tmp/a file #1%.heapsnapshot', '/tmp/Ägypten/😀.txt'])(
  'showOpenDialog returns an encoded file URI for %s',
  async (path) => {
    // @ts-ignore
    Electron.dialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [path] })
    const result = await ElectronDialog.showOpenDialog('Open File', ['openFile'])
    expect(result).toBe(pathToFileURL(path).href)
  },
)

test.each([
  { canceled: true, filePaths: ['/tmp/file.txt'] },
  { canceled: false, filePaths: [] },
  { canceled: false, filePaths: ['/tmp/one.txt', '/tmp/two.txt'] },
])('showOpenDialog returns undefined when selection is canceled or is not singular', async (result) => {
  // @ts-ignore
  Electron.dialog.showOpenDialog.mockResolvedValue(result)
  await expect(ElectronDialog.showOpenDialog('Open File', ['openFile'])).resolves.toBeUndefined()
})

test('showOpenDialog returns undefined when there is no focused window', async () => {
  // @ts-ignore
  Electron.BrowserWindow.getFocusedWindow.mockReturnValue(undefined)
  await expect(ElectronDialog.showOpenDialog('Open File', ['openFile'])).resolves.toBeUndefined()
  // @ts-ignore
  expect(Electron.dialog.showOpenDialog).not.toHaveBeenCalled()
})
