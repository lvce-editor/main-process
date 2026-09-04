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

test('encryptString does not enable the non-persistent in-memory fallback', () => {
  // @ts-expect-error
  electron.safeStorage.isEncryptionAvailable.mockReturnValue(false)
  // @ts-expect-error
  electron.safeStorage.encryptString.mockImplementation(() => {
    throw new Error('Encryption is not available')
  })

  expect(() => ElectronSafeStorage.encrypt('test')).toThrow(new Error('Encryption is not available'))
  expect(electron.safeStorage.setUsePlainTextEncryption).not.toHaveBeenCalled()
  expect(electron.safeStorage.encryptString).toHaveBeenCalledWith('test')
})
