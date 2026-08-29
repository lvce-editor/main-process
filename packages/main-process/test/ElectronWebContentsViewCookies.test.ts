import { expect, jest, test } from '@jest/globals'

const getSession = jest.fn<() => any>()

jest.unstable_mockModule('../src/parts/ElectronSessionForBrowserView/ElectronSessionForBrowserView.ts', () => ({ getSession }))

const ElectronWebContentsViewCookies = await import('../src/parts/ElectronWebContentsViewCookies/ElectronWebContentsViewCookies.ts')

test('addCookiesToSession adds every cookie and flushes the session', async () => {
  const set = jest.fn<(cookie: any) => Promise<void>>().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('failed'))
  const flushStore = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
  const session = { cookies: { flushStore, set } } as any
  const cookies = [{ name: 'one' }, { name: 'two' }] as any

  await expect(ElectronWebContentsViewCookies.addCookiesToSession(session, cookies)).resolves.toEqual({ added: 1, failed: 1 })
  expect(set).toHaveBeenNthCalledWith(1, cookies[0])
  expect(set).toHaveBeenNthCalledWith(2, cookies[1])
  expect(flushStore).toHaveBeenCalledTimes(1)
})

test('removeCookiesFromSession removes every cookie and flushes the session', async () => {
  const remove = jest.fn<(url: string, name: string) => Promise<void>>().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('failed'))
  const flushStore = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
  const session = { cookies: { flushStore, remove } } as any
  const cookies = [
    { name: 'one', url: 'https://example.com/' },
    { name: 'two', url: 'https://example.org/' },
  ]

  await expect(ElectronWebContentsViewCookies.removeCookiesFromSession(session, cookies)).resolves.toEqual({ failed: 1, removed: 1 })
  expect(remove).toHaveBeenNthCalledWith(1, cookies[0].url, cookies[0].name)
  expect(remove).toHaveBeenNthCalledWith(2, cookies[1].url, cookies[1].name)
  expect(flushStore).toHaveBeenCalledTimes(1)
})

test('addCookies uses the web contents view session', async () => {
  const set = jest.fn<(cookie: any) => Promise<void>>().mockResolvedValue(undefined)
  const flushStore = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
  getSession.mockReturnValue({ cookies: { flushStore, set } })

  await expect(ElectronWebContentsViewCookies.addCookies([{ name: 'one' }] as any)).resolves.toEqual({ added: 1, failed: 0 })
})

test('removeCookies uses the web contents view session', async () => {
  const remove = jest.fn<(url: string, name: string) => Promise<void>>().mockResolvedValue(undefined)
  const flushStore = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
  getSession.mockReturnValue({ cookies: { flushStore, remove } })

  await expect(ElectronWebContentsViewCookies.removeCookies([{ name: 'one', url: 'https://example.com/' }])).resolves.toEqual({
    failed: 0,
    removed: 1,
  })
})
