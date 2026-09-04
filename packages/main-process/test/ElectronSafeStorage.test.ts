import { beforeEach, expect, jest, test } from '@jest/globals'

jest.unstable_mockModule('electron', () => {
  return {
    safeStorage: {
      decryptString: jest.fn(),
      encryptString: jest.fn(),
      isEncryptionAvailable: jest.fn(),
      setUsePlainTextEncryption: jest.fn(),
    },
  }
})

jest.unstable_mockModule('../src/parts/Platform/Platform.ts', () => ({
  isLinux: true,
}))

const electron = await import('electron')
const ElectronSafeStorage = await import('../src/parts/ElectronSafeStorage/ElectronSafeStorage.ts')

beforeEach(() => {
  jest.resetAllMocks()
  // @ts-expect-error
  electron.safeStorage.isEncryptionAvailable.mockReturnValue(true)
})

test('isEncryptionAvailable - error', () => {
  // @ts-expect-error
  electron.safeStorage.isEncryptionAvailable.mockImplementation(() => {
    throw new TypeError('x is not a function')
  })
  expect(() => ElectronSafeStorage.isEncryptionAvailable()).toThrow(new TypeError('x is not a function'))
})

test('isEncryptionAvailable', () => {
  // @ts-expect-error
  electron.safeStorage.isEncryptionAvailable.mockImplementation(() => {
    return true
  })
  expect(ElectronSafeStorage.isEncryptionAvailable()).toBe(true)
  expect(electron.safeStorage.isEncryptionAvailable).toHaveBeenCalledTimes(1)
})

test('encryptString - error', () => {
  // @ts-expect-error
  electron.safeStorage.encryptString.mockImplementation(() => {
    throw new TypeError('x is not a function')
  })
  expect(() => ElectronSafeStorage.encrypt('test')).toThrow(new TypeError('x is not a function'))
})

test('encryptString', () => {
  // @ts-expect-error
  electron.safeStorage.encryptString.mockImplementation(() => {
    return 'encrypted'
  })
  expect(ElectronSafeStorage.encrypt('test')).toBe('encrypted')
  expect(electron.safeStorage.encryptString).toHaveBeenCalledTimes(1)
  expect(electron.safeStorage.encryptString).toHaveBeenCalledWith('test')
})

test('encryptString enables the Linux fallback when OS encryption is unavailable', () => {
  // @ts-expect-error
  electron.safeStorage.isEncryptionAvailable.mockReturnValue(false)
  // @ts-expect-error
  electron.safeStorage.encryptString.mockReturnValue(Buffer.from('encrypted'))

  expect(ElectronSafeStorage.encrypt('test')).toBe(Buffer.from('encrypted').toString('base64'))
  expect(electron.safeStorage.setUsePlainTextEncryption).toHaveBeenCalledWith(true)
  expect(electron.safeStorage.encryptString).toHaveBeenCalledWith('test')
})

test('decryptString enables the Linux fallback when OS encryption is unavailable', () => {
  // @ts-expect-error
  electron.safeStorage.isEncryptionAvailable.mockReturnValue(false)
  // @ts-expect-error
  electron.safeStorage.decryptString.mockReturnValue('decrypted')

  expect(ElectronSafeStorage.decrypt(Buffer.from('encrypted').toString('base64'))).toBe('decrypted')
  expect(electron.safeStorage.setUsePlainTextEncryption).toHaveBeenCalledWith(true)
  expect(electron.safeStorage.decryptString).toHaveBeenCalledWith(Buffer.from('encrypted'))
})
