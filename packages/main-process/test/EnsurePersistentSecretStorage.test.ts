import { beforeEach, expect, jest, test } from '@jest/globals'

const electronApp = {
  exit: jest.fn(),
  relaunch: jest.fn(),
}

const safeStorage = {
  getSelectedStorageBackend: jest.fn(),
  isEncryptionAvailable: jest.fn(),
  setUsePlainTextEncryption: jest.fn(),
}

jest.unstable_mockModule('electron', () => ({
  app: electronApp,
  safeStorage,
}))

jest.unstable_mockModule('../src/parts/Platform/Platform.ts', () => ({
  isLinux: true,
}))

const EnsurePersistentSecretStorage = await import('../src/parts/EnsurePersistentSecretStorage/EnsurePersistentSecretStorage.ts')

beforeEach(() => {
  jest.clearAllMocks()
  safeStorage.getSelectedStorageBackend.mockReturnValue('gnome_libsecret')
  safeStorage.isEncryptionAvailable.mockReturnValue(true)
})

test('continues startup when encryption is available', () => {
  const argv = ['/usr/lib/lvce/lvce', '/test/']

  expect(EnsurePersistentSecretStorage.ensurePersistentSecretStorage(argv)).toBe(true)
  expect(electronApp.relaunch).not.toHaveBeenCalled()
  expect(electronApp.exit).not.toHaveBeenCalled()
})

test('relaunches Linux with the persistent basic password store when encryption is unavailable', () => {
  safeStorage.isEncryptionAvailable.mockReturnValue(false)
  const argv = ['/usr/lib/lvce/lvce', '/test/']

  expect(EnsurePersistentSecretStorage.ensurePersistentSecretStorage(argv)).toBe(false)
  expect(electronApp.relaunch).toHaveBeenCalledWith({
    args: ['--password-store=basic', '/test/'],
  })
  expect(electronApp.exit).toHaveBeenCalledWith(0)
})

test('enables the selected persistent basic password store', () => {
  safeStorage.isEncryptionAvailable.mockReturnValue(false)
  safeStorage.getSelectedStorageBackend.mockReturnValue('basic_text')
  const argv = ['/usr/lib/lvce/lvce', '--password-store=basic', '/test/']

  expect(EnsurePersistentSecretStorage.ensurePersistentSecretStorage(argv)).toBe(true)
  expect(safeStorage.setUsePlainTextEncryption).toHaveBeenCalledWith(true)
  expect(electronApp.relaunch).not.toHaveBeenCalled()
  expect(electronApp.exit).not.toHaveBeenCalled()
})

test('does not relaunch repeatedly when an explicitly selected password store is unavailable', () => {
  safeStorage.isEncryptionAvailable.mockReturnValue(false)
  const argv = ['/usr/lib/lvce/lvce', '--password-store=gnome-libsecret', '/test/']

  expect(() => EnsurePersistentSecretStorage.ensurePersistentSecretStorage(argv)).toThrow(new Error('Persistent secret storage is unavailable'))
  expect(electronApp.relaunch).not.toHaveBeenCalled()
  expect(electronApp.exit).not.toHaveBeenCalled()
})
