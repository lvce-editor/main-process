import { afterEach, expect, jest, test } from '@jest/globals'

const sessionBus = jest.fn<() => any>()

class Variant {
  constructor(
    public readonly signature: string,
    public readonly value: unknown,
  ) {}
}

jest.unstable_mockModule('dbus-native', () => {
  return {
    default: {
      sessionBus,
    },
    Variant,
  }
})

const ChromeCookieKeyring = await import('../src/parts/ChromeCookieKeyring/ChromeCookieKeyring.ts')

afterEach(() => {
  jest.resetAllMocks()
})

test('reads the Chrome Safe Storage password from Secret Service', async () => {
  const service = {
    GetSecrets: jest
      .fn<(items: readonly string[], session: string) => Promise<Readonly<Record<string, readonly [string, Uint8Array, Uint8Array, string]>>>>()
      .mockResolvedValue({
      '/item/chrome': ['/session/1', Buffer.alloc(0), Buffer.from('safe-storage-password'), 'text/plain'],
    }),
    OpenSession: jest.fn<(algorithm: string, input: unknown) => Promise<readonly [string, string]>>().mockResolvedValue(['', '/session/1']),
    SearchItems: jest
      .fn<(attributes: Readonly<Record<string, string>>) => Promise<readonly [readonly string[], readonly string[]]>>()
      .mockResolvedValue([['/item/chrome'], []]),
    Unlock: jest.fn(),
  }
  const close = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
  const getInterface = jest.fn<() => Promise<unknown>>().mockResolvedValue(service)
  sessionBus.mockReturnValue({
    close,
    getService: jest.fn().mockReturnValue({ getInterface }),
  })

  await expect(ChromeCookieKeyring.getChromeSafeStoragePassword()).resolves.toBe('safe-storage-password')
  expect(service.OpenSession).toHaveBeenCalledWith('plain', expect.objectContaining({ signature: 's', value: '' }))
  expect(service.SearchItems).toHaveBeenCalledWith({ application: 'chrome' })
  expect(service.GetSecrets).toHaveBeenCalledWith(['/item/chrome'], '/session/1')
  expect(service.Unlock).not.toHaveBeenCalled()
  expect(close).toHaveBeenCalledTimes(1)
})

test('reports when Chrome Safe Storage is locked and always closes the bus', async () => {
  const service = {
    GetSecrets: jest
      .fn<(items: readonly string[], session: string) => Promise<Readonly<Record<string, readonly [string, Uint8Array, Uint8Array, string]>>>>()
      .mockRejectedValue(new Error('locked')),
    OpenSession: jest.fn<() => Promise<readonly [string, string]>>().mockResolvedValue(['', '/session/1']),
    SearchItems: jest.fn<() => Promise<readonly [readonly string[], readonly string[]]>>().mockResolvedValue([[], ['/item/chrome']]),
    Unlock: jest.fn<() => Promise<readonly [readonly string[], string]>>().mockResolvedValue([[], '/prompt/1']),
  }
  const close = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
  sessionBus.mockReturnValue({
    close,
    getService: jest.fn().mockReturnValue({
      getInterface: jest.fn<() => Promise<unknown>>().mockResolvedValue(service),
    }),
  })

  await expect(ChromeCookieKeyring.getChromeSafeStoragePassword()).rejects.toThrow(
    'Failed to read Chrome Safe Storage password: Chrome Safe Storage is locked; unlock the desktop keyring and try again',
  )
  expect(close).toHaveBeenCalledTimes(1)
})
