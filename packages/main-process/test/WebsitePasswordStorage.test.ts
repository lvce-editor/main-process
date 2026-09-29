/* eslint-disable sonarjs/no-hardcoded-passwords -- Deliberately synthetic credentials for vault persistence tests. */
import { afterAll, beforeEach, expect, jest, test } from '@jest/globals'
import * as fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const directory = await fs.mkdtemp(join(tmpdir(), 'website-password-test-'))
const path = join(directory, 'website-passwords.json')
const available = jest.fn(() => true)
const backend = jest.fn(() => 'gnome_libsecret')
const encrypt = jest.fn((value: string) => Buffer.from(value).toString('base64'))
const decrypt = jest.fn((value: string) => Buffer.from(value, 'base64').toString())
const rename = jest.fn(fs.rename)
jest.unstable_mockModule('node:fs/promises', () => ({ ...fs, rename }))
jest.unstable_mockModule('../src/parts/Platform/Platform.ts', () => ({ configDir: directory, isLinux: true }))
jest.unstable_mockModule('../src/parts/ElectronSafeStorage/ElectronSafeStorage.ts', () => ({
  decrypt,
  encrypt,
  getSelectedStorageBackend: backend,
  isEncryptionAvailable: available,
}))
const Storage = await import('../src/parts/WebsitePasswordStorage/WebsitePasswordStorage.ts')
const credential = { origin: 'https://site.test', password: 'a-secret-password', username: 'alice' }

beforeEach(async () => {
  await fs.rm(path, { force: true })
  available.mockReturnValue(true)
  backend.mockReturnValue('gnome_libsecret')
  rename.mockImplementation(fs.rename)
  jest.clearAllMocks()
})
afterAll(async () => fs.rm(directory, { force: true, recursive: true }))

test('persists encrypted credentials, lists metadata, updates and deletes independently', async () => {
  await Storage.save(credential)
  const content = await fs.readFile(path, 'utf8')
  expect(content).not.toContain(credential.password)
  expect(content).not.toContain(credential.username)
  expect(await Storage.list()).toEqual([{ origin: credential.origin, username: credential.username }])
  expect(await Storage.get(credential.origin, credential.username)).toEqual(credential)
  await Storage.save({ ...credential, password: 'updated-secret' })
  expect(await Storage.get(credential.origin, credential.username)).toEqual({ ...credential, password: 'updated-secret' })
  expect(await Storage.get('https://other.test', credential.username)).toBeUndefined()
  await Storage.remove(credential.origin, credential.username)
  expect(await Storage.list()).toEqual([])
})

test.each(['basic_text', 'unknown'])('rejects insecure backend %s before reading or encrypting', async (value) => {
  backend.mockReturnValue(value)
  expect(Storage.isAvailable()).toBe(false)
  await expect(Storage.save(credential)).rejects.toThrow('keyring')
  await expect(Storage.get(credential.origin, credential.username)).rejects.toThrow('keyring')
  expect(encrypt).not.toHaveBeenCalled()
  expect(decrypt).not.toHaveBeenCalled()
})

test('unavailable encryption blocks saving and reading', async () => {
  available.mockReturnValue(false)
  await expect(Storage.save(credential)).rejects.toThrow('keyring')
  await expect(Storage.list()).rejects.toThrow('keyring')
})

test('serializes concurrent updates without losing accounts', async () => {
  await Promise.all(Array.from({ length: 8 }, (_, index) => Storage.save({ ...credential, username: `user${index}` })))
  expect(await Storage.list()).toHaveLength(8)
  await Promise.all([Storage.remove(credential.origin, 'user0'), Storage.save({ ...credential, username: 'last' })])
  expect(await Storage.list()).toHaveLength(8)
  expect(await Storage.get(credential.origin, 'user0')).toBeUndefined()
  expect(await Storage.get(credential.origin, 'last')).toEqual({ ...credential, username: 'last' })
})

test('failed atomic replacement preserves the previous vault and queue recovers', async () => {
  await Storage.save(credential)
  const original = await fs.readFile(path, 'utf8')
  rename.mockRejectedValueOnce(new Error('disk failure'))
  await expect(Storage.save({ ...credential, password: 'replacement' })).rejects.toThrow('disk failure')
  expect(await fs.readFile(path, 'utf8')).toBe(original)
  expect(await fs.readdir(directory)).toEqual(['website-passwords.json'])
  await Storage.save({ ...credential, username: 'bob' })
  expect(await Storage.list()).toHaveLength(2)
})

test('corrupt vault is not overwritten and errors do not expose its content', async () => {
  await fs.writeFile(path, 'private corrupted contents')
  await expect(Storage.save(credential)).rejects.toThrow('existing file has been preserved')
  expect(await fs.readFile(path, 'utf8')).toBe('private corrupted contents')
})

test('navigation or disposal while queued prevents saving', async () => {
  await Storage.save(credential, () => false)
  expect(await Storage.list()).toEqual([])
})

test('rejects insecure and noncanonical origins', async () => {
  await expect(Storage.save({ ...credential, origin: 'http://site.test' })).rejects.toThrow('HTTPS')
  await expect(Storage.save({ ...credential, origin: 'https://site.test/path' })).rejects.toThrow('Invalid')
})
