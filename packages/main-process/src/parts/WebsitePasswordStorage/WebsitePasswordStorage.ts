import { randomUUID } from 'node:crypto'
import { mkdir, open, readFile, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'
import * as ElectronSafeStorage from '../ElectronSafeStorage/ElectronSafeStorage.ts'
import * as Platform from '../Platform/Platform.ts'

export interface Credential {
  readonly origin: string
  readonly password: string
  readonly username: string
}

const path = join(Platform.configDir, 'website-passwords.json')
let pending: Promise<unknown> = Promise.resolve()

export const isAvailable = (): boolean => {
  if (!ElectronSafeStorage.isEncryptionAvailable()) return false
  if (!Platform.isLinux) return true
  return ['gnome_libsecret', 'kwallet', 'kwallet5', 'kwallet6'].includes(ElectronSafeStorage.getSelectedStorageBackend())
}

const requireAvailable = (): void => {
  if (!isAvailable()) throw new Error('Website passwords require an available OS keyring.')
}

export const getOrigin = (url: string): string => {
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('Website passwords require HTTPS.')
  return parsed.origin
}

const exclusive = async <T>(operation: () => Promise<T>): Promise<T> => {
  const previous = pending
  const { promise, resolve } = Promise.withResolvers<void>()
  pending = promise
  await previous
  try {
    requireAvailable()
    return await operation()
  } finally {
    resolve()
  }
}

const read = async (): Promise<Credential[]> => {
  let content: string
  try {
    content = await readFile(path, 'utf8')
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return []
    throw new Error('Could not read website passwords.')
  }
  try {
    const envelope = JSON.parse(content)
    if (envelope.version !== 1 || typeof envelope.encrypted !== 'string') throw new Error('Invalid vault')
    requireAvailable()
    const records = JSON.parse(ElectronSafeStorage.decrypt(envelope.encrypted))
    if (
      !Array.isArray(records) ||
      records.some((entry) => typeof entry.username !== 'string' || typeof entry.password !== 'string' || getOrigin(entry.origin) !== entry.origin)
    ) {
      throw new Error('Invalid vault')
    }
    return records
  } catch {
    // Never propagate parsing/decryption errors that might contain plaintext.
    throw new Error('Could not unlock website passwords. The existing file has been preserved.')
  }
}

const write = async (records: readonly Credential[], isCurrent: () => boolean): Promise<void> => {
  requireAvailable()
  const encrypted = ElectronSafeStorage.encrypt(JSON.stringify(records))
  await mkdir(Platform.configDir, { recursive: true })
  const temporary = `${path}.${randomUUID()}.tmp`
  try {
    const file = await open(temporary, 'wx', 0o600)
    try {
      await file.writeFile(JSON.stringify({ encrypted, version: 1 }))
      await file.sync()
    } finally {
      await file.close()
    }
    requireAvailable()
    if (!isCurrent()) return
    await rename(temporary, path)
  } finally {
    await rm(temporary, { force: true })
  }
}

export const list = (): Promise<readonly Omit<Credential, 'password'>[]> =>
  exclusive(async () => {
    const records = await read()
    return records.map(({ origin, username }) => ({ origin, username }))
  })

export const get = (origin: string, username: string): Promise<Credential | undefined> =>
  exclusive(async () => {
    getOrigin(origin)
    const records = await read()
    return records.find((entry) => entry.origin === origin && entry.username === username)
  })

export const save = (credential: Credential, isCurrent = (): boolean => true): Promise<void> =>
  exclusive(async () => {
    if (
      getOrigin(credential.origin) !== credential.origin ||
      credential.username.length > 1024 ||
      !credential.password ||
      credential.password.length > 16_384
    ) {
      throw new Error('Invalid website credential.')
    }
    const records = await read()
    if (!isCurrent()) return
    const next = records.filter((entry) => entry.origin !== credential.origin || entry.username !== credential.username)
    await write([...next, credential], isCurrent)
  })

export const remove = (origin: string, username: string): Promise<void> =>
  exclusive(async () => {
    const records = await read()
    await write(
      records.filter((entry) => entry.origin !== origin || entry.username !== username),
      () => true,
    )
  })
