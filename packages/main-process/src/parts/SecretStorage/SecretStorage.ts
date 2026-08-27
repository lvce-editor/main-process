import * as Assert from '@lvce-editor/assert'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import * as ElectronSafeStorage from '../ElectronSafeStorage/ElectronSafeStorage.ts'
import * as Path from '../Path/Path.ts'
import * as Platform from '../Platform/Platform.ts'

export interface Secret {
  readonly extensionId: string
  readonly key: string
}

type StoredSecrets = Record<string, Record<string, string>>

const storagePath = Path.join(Platform.configDir, 'secrets.json')

const pendingOperations: (() => Promise<void>)[] = []
let isRunning = false

const runPendingOperations = async (): Promise<void> => {
  if (isRunning) {
    return
  }
  isRunning = true
  let operation: (() => Promise<void>) | undefined
  while ((operation = pendingOperations.shift())) {
    await operation()
  }
  isRunning = false
}

const runExclusive = <T>(operation: () => Promise<T>): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    pendingOperations.push(async () => {
      try {
        resolve(await operation())
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })
    void runPendingOperations()
  })
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const normalizeStoredSecrets = (value: unknown): StoredSecrets => {
  if (!isRecord(value)) {
    return {}
  }
  const storedSecrets: StoredSecrets = {}
  for (const [extensionId, extensionValue] of Object.entries(value)) {
    if (!isRecord(extensionValue)) {
      continue
    }
    const extensionSecrets: Record<string, string> = {}
    for (const [key, encrypted] of Object.entries(extensionValue)) {
      if (typeof encrypted === 'string') {
        extensionSecrets[key] = encrypted
      }
    }
    if (Object.keys(extensionSecrets).length > 0) {
      storedSecrets[extensionId] = extensionSecrets
    }
  }
  return storedSecrets
}

const readStoredSecrets = async (): Promise<StoredSecrets> => {
  try {
    const content = await readFile(storagePath, 'utf8')
    return normalizeStoredSecrets(JSON.parse(content))
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return {}
    }
    throw error
  }
}

const writeStoredSecrets = async (storedSecrets: StoredSecrets): Promise<void> => {
  await mkdir(Path.dirname(storagePath), { recursive: true })
  await writeFile(storagePath, `${JSON.stringify(storedSecrets, undefined, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  })
}

export const deleteSecret = (extensionId: string, key: string): Promise<void> => {
  Assert.string(extensionId)
  Assert.string(key)
  return runExclusive(async () => {
    const storedSecrets = await readStoredSecrets()
    const extensionSecrets = storedSecrets[extensionId]
    if (!extensionSecrets || typeof extensionSecrets[key] !== 'string') {
      return
    }
    const nextExtensionSecrets = { ...extensionSecrets }
    delete nextExtensionSecrets[key]
    if (Object.keys(nextExtensionSecrets).length === 0) {
      delete storedSecrets[extensionId]
    } else {
      storedSecrets[extensionId] = nextExtensionSecrets
    }
    await writeStoredSecrets(storedSecrets)
  })
}

export const get = (extensionId: string, key: string): Promise<string | undefined> => {
  Assert.string(extensionId)
  Assert.string(key)
  return runExclusive(async () => {
    const storedSecrets = await readStoredSecrets()
    const encrypted = storedSecrets[extensionId]?.[key]
    if (typeof encrypted !== 'string') {
      return undefined
    }
    return ElectronSafeStorage.decrypt(encrypted)
  })
}

export const list = (): Promise<readonly Secret[]> => {
  return runExclusive(async () => {
    const storedSecrets = await readStoredSecrets()
    return Object.entries(storedSecrets).flatMap(([extensionId, extensionSecrets]) =>
      Object.keys(extensionSecrets).map((key) => ({ extensionId, key })),
    )
  })
}

export const store = (extensionId: string, key: string, value: string): Promise<void> => {
  Assert.string(extensionId)
  Assert.string(key)
  Assert.string(value)
  return runExclusive(async () => {
    const encrypted = ElectronSafeStorage.encrypt(value)
    const storedSecrets = await readStoredSecrets()
    storedSecrets[extensionId] = {
      ...storedSecrets[extensionId],
      [key]: encrypted,
    }
    await writeStoredSecrets(storedSecrets)
  })
}
