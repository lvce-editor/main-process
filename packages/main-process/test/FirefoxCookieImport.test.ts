import { afterEach, expect, jest, test } from '@jest/globals'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const temporaryDirectories: string[] = []
const getCookieCount = jest.fn<(path: string) => number>()
const readCookies = jest.fn<(path: string) => { readonly rows: readonly any[]; readonly version: number }>()

jest.unstable_mockModule('electron', () => {
  return {
    session: {
      fromPartition: jest.fn(),
    },
  }
})

jest.unstable_mockModule('../src/parts/FirefoxCookieDatabase/FirefoxCookieDatabase.ts', () => {
  return {
    getCookieCount,
    readCookies,
  }
})

const FirefoxCookieImport = await import('../src/parts/FirefoxCookieImport/FirefoxCookieImport.ts')

interface CookieFixture {
  readonly expiry?: number
  readonly host?: string
  readonly isHttpOnly?: number
  readonly isSecure?: number
  readonly name?: string
  readonly originAttributes?: string
  readonly path?: string
  readonly sameSite?: number
  readonly value?: string
}

const createTemporaryDirectory = (): string => {
  const directory = mkdtempSync(join(tmpdir(), 'firefox-cookie-import-'))
  temporaryDirectories.push(directory)
  return directory
}

const createCookie = (fixture: CookieFixture = {}): any => {
  return {
    expiry: fixture.expiry ?? Date.now() + 3_600_000,
    host: fixture.host || 'example.com',
    isHttpOnly: fixture.isHttpOnly || 0,
    isSecure: fixture.isSecure || 0,
    name: fixture.name ?? 'session',
    originAttributes: fixture.originAttributes || '',
    path: fixture.path || '/',
    sameSite: fixture.sameSite ?? 256,
    value: fixture.value ?? 'secret',
  }
}

const createFirefoxProfile = (): string => {
  const firefoxDataDirectory = createTemporaryDirectory()
  writeFileSync(
    join(firefoxDataDirectory, 'profiles.ini'),
    [
      '[Profile0]',
      'Name=Default profile',
      'IsRelative=1',
      'Path=Profiles/default',
      'Default=1',
      '',
      '[Profile1]',
      'Name=Work',
      'IsRelative=1',
      'Path=Profiles/work',
      '',
      '[InstallOld]',
      'Default=Profiles/default',
      '',
      '[Install1234]',
      'Default=Profiles/work',
      'Locked=1',
    ].join('\n'),
  )
  mkdirSync(join(firefoxDataDirectory, 'Profiles', 'work'), { recursive: true })
  writeFileSync(join(firefoxDataDirectory, 'Profiles', 'work', 'cookies.sqlite'), '')
  return firefoxDataDirectory
}

afterEach(() => {
  for (const directory of temporaryDirectories) {
    rmSync(directory, { force: true, recursive: true })
  }
  temporaryDirectories.length = 0
  jest.resetAllMocks()
})

test('getInfoFromDirectory selects the install default profile', () => {
  const firefoxDataDirectory = createFirefoxProfile()
  getCookieCount.mockReturnValue(2)

  expect(FirefoxCookieImport.getInfoFromDirectory(firefoxDataDirectory)).toEqual({
    cookieCount: 2,
    profileDirectory: 'Profiles/work',
    profileName: 'Work',
  })
  expect(getCookieCount).toHaveBeenCalledWith(join(firefoxDataDirectory, 'Profiles', 'work', 'cookies.sqlite'))
})

test('importFromDirectory imports regular cookies and skips expired and isolated cookies', async () => {
  const firefoxDataDirectory = createFirefoxProfile()
  readCookies.mockReturnValue({
    rows: [
      createCookie({
        host: '.example.com',
        isHttpOnly: 1,
        isSecure: 1,
        name: 'persistent',
        path: '/account',
        sameSite: 1,
      }),
      createCookie({
        host: 'example.org',
        name: 'host-only',
      }),
      createCookie({
        expiry: Date.now() - 3_600_000,
        name: 'expired',
      }),
      createCookie({
        name: 'container',
        originAttributes: '^userContextId=1',
      }),
    ],
    version: 17,
  })
  const set = jest.fn<(...args: readonly any[]) => Promise<void>>().mockResolvedValue(undefined)
  const flushStore = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)

  await expect(
    FirefoxCookieImport.importFromDirectory(firefoxDataDirectory, {
      cookies: {
        flushStore,
        set,
      } as any,
    }),
  ).resolves.toEqual({
    failed: 0,
    imported: 2,
    skipped: 2,
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
    expirationDate: expect.any(Number),
    httpOnly: false,
    name: 'host-only',
    path: '/',
    sameSite: 'unspecified',
    secure: false,
    url: 'http://example.org/',
    value: 'secret',
  })
  expect(flushStore).toHaveBeenCalledTimes(1)
})

test('importFromDirectory reports destination failures and still flushes', async () => {
  const firefoxDataDirectory = createFirefoxProfile()
  readCookies.mockReturnValue({
    rows: [createCookie({ name: 'one' }), createCookie({ name: 'two' })],
    version: 17,
  })
  const set = jest.fn<(...args: readonly any[]) => Promise<void>>().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('failed'))
  const flushStore = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)

  await expect(
    FirefoxCookieImport.importFromDirectory(firefoxDataDirectory, {
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
