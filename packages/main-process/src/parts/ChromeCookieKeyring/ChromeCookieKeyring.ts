import type { DBusInterface, MessageBus, Variant } from 'dbus-native'

const secretServiceName = 'org.freedesktop.secrets'
const secretServicePath = '/org/freedesktop/secrets'
const secretServiceInterface = 'org.freedesktop.Secret.Service'
const secretCollectionInterface = 'org.freedesktop.Secret.Collection'
const secretItemInterface = 'org.freedesktop.Secret.Item'
const propertiesInterface = 'org.freedesktop.DBus.Properties'
const defaultCollectionPath = '/org/freedesktop/secrets/aliases/default'
const chromeSafeStorageLabel = 'Chrome Safe Storage'

interface SecretService extends DBusInterface {
  GetSecrets(items: readonly string[], session: string): PromiseLike<Readonly<Record<string, readonly [string, Uint8Array, Uint8Array, string]>>>
  OpenSession(algorithm: string, input: Variant<string>): PromiseLike<readonly [unknown, string]>
  SearchItems(attributes: Readonly<Record<string, string>>): PromiseLike<readonly [readonly string[], readonly string[]]>
  Unlock(items: readonly string[]): PromiseLike<readonly [readonly string[], string]>
}

interface Properties extends DBusInterface {
  Get(interfaceName: string, propertyName: string): PromiseLike<unknown>
}

const getProperties = async (bus: MessageBus, path: string): Promise<Properties> => {
  return bus.getService(secretServiceName).getInterface<Properties>(path, propertiesInterface)
}

const findChromeSafeStorageItem = async (bus: MessageBus, service: SecretService): Promise<string> => {
  const [unlocked, locked] = await service.SearchItems({ application: 'chrome' })
  const matchingItems = [...unlocked, ...locked]
  if (matchingItems.length > 0) {
    return matchingItems[0]
  }

  const collectionProperties = await getProperties(bus, defaultCollectionPath)
  const items = (await collectionProperties.Get(secretCollectionInterface, 'Items')) as readonly string[]
  for (const item of items) {
    const itemProperties = await getProperties(bus, item)
    const label = await itemProperties.Get(secretItemInterface, 'Label')
    if (label === chromeSafeStorageLabel) {
      return item
    }
  }
  throw new Error('Chrome Safe Storage password was not found in the Linux keyring')
}

const unlockItem = async (service: SecretService, item: string): Promise<void> => {
  const [unlocked, prompt] = await service.Unlock([item])
  if (unlocked.includes(item)) {
    return
  }
  if (prompt !== '/') {
    throw new Error('Chrome Safe Storage is locked; unlock the desktop keyring and try again')
  }
  throw new Error('Chrome Safe Storage could not be unlocked')
}

const readPassword = async (bus: MessageBus, sessionInput: Variant<string>): Promise<string> => {
  const service = await bus.getService(secretServiceName).getInterface<SecretService>(secretServicePath, secretServiceInterface)
  const [, sessionPath] = await service.OpenSession('plain', sessionInput)
  const item = await findChromeSafeStorageItem(bus, service)
  let secrets: Readonly<Record<string, readonly [string, Uint8Array, Uint8Array, string]>>
  try {
    secrets = await service.GetSecrets([item], sessionPath)
  } catch {
    await unlockItem(service, item)
    secrets = await service.GetSecrets([item], sessionPath)
  }
  const secret = secrets[item]
  if (!secret) {
    throw new Error('Chrome Safe Storage password was not returned by the Linux keyring')
  }
  return Buffer.from(secret[2]).toString('utf8')
}

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error)
}

export const getChromeSafeStoragePassword = async (): Promise<string> => {
  const { default: dbus, Variant } = await import('dbus-native')
  const bus = dbus.sessionBus({ timeout: 5000 })
  try {
    return await readPassword(bus, new Variant('s', ''))
  } catch (error) {
    throw new Error(`Failed to read Chrome Safe Storage password: ${getErrorMessage(error)}`)
  } finally {
    await bus.close()
  }
}
