import { afterEach, expect, jest, test } from '@jest/globals'
import { createCipheriv, createHash, pbkdf2Sync } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const temporaryDirectories: string[] = []
const chromeEpochOffsetMicroseconds = 11_644_473_600_000_000n
const getCookieCount = jest.fn<(path: string) => number>()
const readCookies = jest.fn<(path: string) => { readonly rows: readonly any[]; readonly version: number }>()

jest.unstable_mockModule('electron', () => {
  return {
    session: {
      fromPartition: jest.fn(),
    },
  }
})

jest.unstable_mockModule('../src/parts/ChromeCookieDatabase/ChromeCookieDatabase.ts', () => {
  return {
    getCookieCount,
    readCookies,
  }
})

const ChromeCookieDecrypt = await import('../src/parts/ChromeCookieDecrypt/ChromeCookieDecrypt.ts')
const ChromeCookieImport = await import('../src/parts/ChromeCookieImport/ChromeCookieImport.ts')

interface CookieFixture {
  readonly encryptedValue?: Uint8Array
  readonly expiresUtc?: string
  readonly hasExpires?: number
  readonly hostKey?: string
  readonly isHttpOnly?: number
  readonly isSecure?: number
  readonly name?: string
  readonly path?: string
  readonly sameSite?: number
  readonly topFrameSiteKey?: string
  readonly value?: string
}

const createTemporaryDirectory = (): string => {
  const directory = mkdtempSync(join(tmpdir(), 'chrome-cookie-import-'))
  temporaryDirectories.push(directory)
  return directory
}

const encryptCookie = (hostKey: string, value: string): Buffer => {
  const key = pbkdf2Sync('peanuts', 'saltysalt', 1, 16, 'sha1')
  const iv = Buffer.alloc(16, 0x20)
  const cipher = createCipheriv('aes-128-cbc', key, iv) // eslint-disable-line sonarjs/encryption-secure-mode -- reproduces Chrome's v10 cookie format
  const plaintext = Buffer.concat([createHash('sha256').update(hostKey).digest(), Buffer.from(value)])
  return Buffer.concat([Buffer.from('v10'), cipher.update(plaintext), cipher.final()])
}

const getChromeTimestamp = (unixSeconds: number): string => {
  return (BigInt(Math.floor(unixSeconds)) * 1_000_000n + chromeEpochOffsetMicroseconds).toString()
}

const createCookie = (fixture: CookieFixture = {}): any => {
  const hostKey = fixture.hostKey || 'example.com'
  return {
    encryptedValue: fixture.encryptedValue || encryptCookie(hostKey, 'secret'),
    expiresUtc: fixture.expiresUtc || '0',
    hasExpires: fixture.hasExpires || 0,
    hostKey,
    isHttpOnly: fixture.isHttpOnly || 0,
    isSecure: fixture.isSecure || 0,
    name: fixture.name ?? 'session',
    path: fixture.path || '/',
    sameSite: fixture.sameSite ?? -1,
    topFrameSiteKey: fixture.topFrameSiteKey || '',
    value: fixture.value || '',
  }
}

const createChromeProfile = (
  profiles: Readonly<Record<string, { readonly active_time: number; readonly name: string }>>,
  profileDirectory: string,
): string => {
  const chromeDataDirectory = createTemporaryDirectory()
  writeFileSync(
    join(chromeDataDirectory, 'Local State'),
    JSON.stringify({
      profile: {
        info_cache: profiles,
        profiles_order: Object.keys(profiles),
      },
    }),
  )
  const profilePath = join(chromeDataDirectory, profileDirectory)
  mkdirSync(profilePath, { recursive: true })
  writeFileSync(join(profilePath, 'Cookies'), '')
  return chromeDataDirectory
}

afterEach(() => {
  for (const directory of temporaryDirectories) {
    rmSync(directory, { force: true, recursive: true })
  }
  temporaryDirectories.length = 0
  jest.resetAllMocks()
})

test('getInfoFromDirectory selects the most recently active profile', () => {
  const chromeDataDirectory = createChromeProfile(
    {
      Default: {
        active_time: 1,
        name: 'Default profile',
      },
      'Profile 1': {
        active_time: 2,
        name: 'Work',
      },
    },
    'Profile 1',
  )
  getCookieCount.mockReturnValue(2)

  expect(ChromeCookieImport.getInfoFromDirectory(chromeDataDirectory)).toEqual({
    cookieCount: 2,
    profileDirectory: 'Profile 1',
    profileName: 'Work',
  })
  expect(getCookieCount).toHaveBeenCalledWith(join(chromeDataDirectory, 'Profile 1', 'Cookies'))
})

test('getInfoFromDirectory propagates unsupported database errors', () => {
  const chromeDataDirectory = createChromeProfile(
    {
      Default: {
        active_time: 1,
        name: 'Default profile',
      },
    },
    'Default',
  )
  getCookieCount.mockImplementation(() => {
    throw new Error('Unsupported Chrome cookie database version 23')
  })

  expect(() => ChromeCookieImport.getInfoFromDirectory(chromeDataDirectory)).toThrow('Unsupported Chrome cookie database version 23')
})

test('decrypt validates the version 24 domain hash', () => {
  const encryptedValue = encryptCookie('.example.com', 'secret')

  expect(ChromeCookieDecrypt.decrypt('.example.com', encryptedValue, 24)).toBe('secret')
  expect(() => ChromeCookieDecrypt.decrypt('.other.example.com', encryptedValue, 24)).toThrow('Chrome cookie domain integrity check failed')
})

test('importFromDirectory imports eligible cookies and skips unsupported cookies', async () => {
  const now = Date.now() / 1000
  const chromeDataDirectory = createChromeProfile(
    {
      Default: {
        active_time: 1,
        name: 'Default profile',
      },
    },
    'Default',
  )
  readCookies.mockReturnValue({
    rows: [
      createCookie({
        expiresUtc: getChromeTimestamp(now + 3600),
        hasExpires: 1,
        hostKey: '.example.com',
        isHttpOnly: 1,
        isSecure: 1,
        name: 'persistent',
        path: '/account',
        sameSite: 1,
      }),
      createCookie({
        hostKey: 'example.org',
        name: 'host-only',
        value: 'plaintext',
      }),
      createCookie({
        expiresUtc: getChromeTimestamp(now - 3600),
        hasExpires: 1,
        name: 'expired',
      }),
      createCookie({
        name: 'partitioned',
        topFrameSiteKey: 'https://top.example',
      }),
      createCookie({
        encryptedValue: Buffer.from('v11unsupported'),
        name: 'unsupported',
      }),
    ],
    version: 24,
  })
  const set = jest.fn<(...args: readonly any[]) => Promise<void>>().mockResolvedValue(undefined)
  const flushStore = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)

  await expect(
    ChromeCookieImport.importFromDirectory(chromeDataDirectory, {
      cookies: {
        flushStore,
        set,
      } as any,
    }),
  ).resolves.toEqual({
    failed: 0,
    imported: 2,
    skipped: 3,
  })
  expect(set).toHaveBeenNthCalledWith(1, {
    domain: '.example.com',
    expirationDate: expect.any(Number),
    httpOnly: true,
    name: 'persistent',
    path: '/account',
    sameSite: 'lax',
    secure: true,
    url: 'https://example.com/',
    value: 'secret',
  })
  expect(set).toHaveBeenNthCalledWith(2, {
    httpOnly: false,
    name: 'host-only',
    path: '/',
    sameSite: 'unspecified',
    secure: false,
    url: 'http://example.org/',
    value: 'plaintext',
  })
  expect(flushStore).toHaveBeenCalledTimes(1)
})

test('importFromDirectory reports destination failures and still flushes', async () => {
  const chromeDataDirectory = createChromeProfile(
    {
      Default: {
        active_time: 1,
        name: 'Default profile',
      },
    },
    'Default',
  )
  readCookies.mockReturnValue({
    rows: [createCookie({ name: 'one' }), createCookie({ name: 'two' })],
    version: 24,
  })
  const set = jest.fn<(...args: readonly any[]) => Promise<void>>().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('failed'))
  const flushStore = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)

  await expect(
    ChromeCookieImport.importFromDirectory(chromeDataDirectory, {
      cookies: {
        flushStore,
        set,
      } as any,
    }),
  ).resolves.toEqual({
    failed: 1,
    imported: 1,
    skipped: 0,
  })
  expect(flushStore).toHaveBeenCalledTimes(1)
})

test('importFromDirectory fails closed when every encrypted cookie is unsupported', async () => {
  const chromeDataDirectory = createChromeProfile(
    {
      Default: {
        active_time: 1,
        name: 'Default profile',
      },
    },
    'Default',
  )
  readCookies.mockReturnValue({
    rows: [
      createCookie({
        encryptedValue: Buffer.from('v11unsupported'),
      }),
    ],
    version: 24,
  })
  const flushStore = jest.fn<() => Promise<void>>()
  const set = jest.fn<(...args: readonly any[]) => Promise<void>>()

  await expect(
    ChromeCookieImport.importFromDirectory(chromeDataDirectory, {
      cookies: {
        flushStore,
        set,
      } as any,
    }),
  ).rejects.toThrow('Unsupported Chrome cookie encryption format')
  expect(set).not.toHaveBeenCalled()
  expect(flushStore).not.toHaveBeenCalled()
})
