import { beforeEach, expect, jest, test } from '@jest/globals'

const mkdir = jest.fn<(path: string, options: unknown) => Promise<void>>(async () => undefined)
const readFile = jest.fn<() => Promise<string>>()
const writeFile = jest.fn<(path: string, content: string, options: unknown) => Promise<void>>(async () => undefined)
const decrypt = jest.fn((encrypted: string) => `decrypted:${encrypted}`)
const encrypt = jest.fn((value: string) => `encrypted:${value}`)

jest.unstable_mockModule('node:fs/promises', () => ({
  mkdir,
  readFile,
  writeFile,
}))

jest.unstable_mockModule('../src/parts/ElectronSafeStorage/ElectronSafeStorage.ts', () => ({
  decrypt,
  encrypt,
}))

jest.unstable_mockModule('../src/parts/Platform/Platform.ts', () => ({
  configDir: '/test/config/lvce-oss',
}))

const SecretStorage = await import('../src/parts/SecretStorage/SecretStorage.ts')

const storagePath = '/test/config/lvce-oss/secrets.json'

beforeEach(() => {
  jest.clearAllMocks()
})

test('get returns undefined when storage does not exist', async () => {
  readFile.mockRejectedValue(Object.assign(new Error('not found'), { code: 'ENOENT' }))

  await expect(SecretStorage.get('sample.extension', 'token')).resolves.toBeUndefined()
  expect(decrypt).not.toHaveBeenCalled()
})

test('get decrypts the extension-scoped secret', async () => {
  readFile.mockResolvedValue(JSON.stringify({ 'sample.extension': { token: 'ciphertext' } }))

  await expect(SecretStorage.get('sample.extension', 'token')).resolves.toBe('decrypted:ciphertext')
  expect(decrypt).toHaveBeenCalledWith('ciphertext')
})

test('list returns secret metadata without values', async () => {
  readFile.mockResolvedValue(
    JSON.stringify({
      'other.extension': { credential: 'other-ciphertext' },
      'sample.extension': { token: 'ciphertext' },
    }),
  )

  await expect(SecretStorage.list()).resolves.toEqual([
    { extensionId: 'other.extension', key: 'credential' },
    { extensionId: 'sample.extension', key: 'token' },
  ])
})

test('store encrypts and persists the secret', async () => {
  readFile.mockResolvedValue(JSON.stringify({ 'sample.extension': { existing: 'existing-ciphertext' } }))

  await SecretStorage.store('sample.extension', 'token', 'plain-text')

  expect(encrypt).toHaveBeenCalledWith('plain-text')
  expect(mkdir).toHaveBeenCalledWith('/test/config/lvce-oss', { recursive: true })
  expect(writeFile).toHaveBeenCalledWith(
    storagePath,
    `${JSON.stringify({ 'sample.extension': { existing: 'existing-ciphertext', token: 'encrypted:plain-text' } }, undefined, 2)}\n`,
    { encoding: 'utf8', mode: 0o600 },
  )
})

test('delete removes only the selected secret', async () => {
  readFile.mockResolvedValue(
    JSON.stringify({
      'other.extension': { token: 'other-ciphertext' },
      'sample.extension': { token: 'ciphertext' },
    }),
  )

  await SecretStorage.deleteSecret('sample.extension', 'token')

  expect(writeFile).toHaveBeenCalledWith(storagePath, `${JSON.stringify({ 'other.extension': { token: 'other-ciphertext' } }, undefined, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  })
})
