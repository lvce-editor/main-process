import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { EventEmitter } from 'node:events'

const events = new EventEmitter()
const app = {
  getPath: () => '/Applications/lvce.app/Contents/MacOS/Electron',
  getAppPath: jest.fn(),
  isPackaged: false,
  once: events.once.bind(events),
  quit: jest.fn(),
  relaunch: jest.fn(),
}
const showErrorBox = jest.fn()
const stageUpdate = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const applyUpdate = jest.fn<(update: unknown, rename: unknown, onApplied: () => void) => void>()
jest.unstable_mockModule('electron', () => ({ app, dialog: { showErrorBox } }))
jest.unstable_mockModule('../src/parts/MacUpdate/MacUpdate.ts', () => ({ applyUpdate, stageUpdate }))
const originalPlatform = process.platform
const update = {
  appPath: '/Applications/lvce.app',
  backupPath: '/Applications/.update/previous.app',
  stagedPath: '/Applications/.update/next.app',
  version: '0.115.15',
}

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
  events.removeAllListeners()
  app.getAppPath.mockReturnValue('/Applications/lvce.app/Contents/Resources/app')
  Object.defineProperty(process, 'platform', { value: 'darwin' })
  stageUpdate.mockResolvedValue(update)
  applyUpdate.mockImplementation((_update, _rename, onApplied: () => void) => onApplied())
})

afterEach(() => {
  Object.defineProperty(process, 'platform', { value: originalPlatform })
})

const flush = async (): Promise<void> => new Promise((resolve) => setImmediate(resolve))

test('stages production bundles retaining the Electron executable and applies only after normal shutdown is accepted', async () => {
  const updater = await import('../src/parts/ElectronMacUpdater/ElectronMacUpdater.ts')
  await updater.stage('/cache/update.dmg', '0.115.15')
  updater.restart()
  await flush()
  expect(app.quit).toHaveBeenCalledTimes(1)
  expect(applyUpdate).not.toHaveBeenCalled()
  // A cancelled window close may be retried without installing early or adding another listener.
  updater.restart()
  await flush()
  expect(events.listenerCount('will-quit')).toBe(1)
  events.emit('will-quit', { preventDefault: jest.fn() })
  expect(applyUpdate).toHaveBeenCalledWith(update, undefined, expect.any(Function))
  expect(app.relaunch).toHaveBeenCalledWith({ execPath: app.getPath() })
})

test('rejects development builds before staging', async () => {
  app.getAppPath.mockReturnValue('/workspace/main-process')
  const updater = await import('../src/parts/ElectronMacUpdater/ElectronMacUpdater.ts')
  await expect(updater.stage('/cache/update.dmg', '0.115.15')).rejects.toThrow('installed application build')
  expect(stageUpdate).not.toHaveBeenCalled()
})

test('rejects non-macOS builds before staging', async () => {
  Object.defineProperty(process, 'platform', { value: 'linux' })
  const updater = await import('../src/parts/ElectronMacUpdater/ElectronMacUpdater.ts')
  await expect(updater.stage('/cache/update.dmg', '0.115.15')).rejects.toThrow('installed application build')
  expect(stageUpdate).not.toHaveBeenCalled()
})

test('native replacement failure prevents quit and reports the error without relaunching', async () => {
  const updater = await import('../src/parts/ElectronMacUpdater/ElectronMacUpdater.ts')
  await updater.stage('/cache/update.dmg', '0.115.15')
  applyUpdate.mockImplementation(() => {
    throw new Error('cannot replace app')
  })
  updater.restart()
  await flush()
  const preventDefault = jest.fn()
  events.emit('will-quit', { preventDefault })
  expect(preventDefault).toHaveBeenCalled()
  expect(showErrorBox).toHaveBeenCalledWith('Unable to install update', expect.stringContaining('cannot replace app'))
  expect(app.relaunch).not.toHaveBeenCalled()
})

test('rejects restart before a successful stage', async () => {
  const updater = await import('../src/parts/ElectronMacUpdater/ElectronMacUpdater.ts')
  expect(() => updater.restart()).toThrow('No macOS update')
  expect(app.quit).not.toHaveBeenCalled()
})
