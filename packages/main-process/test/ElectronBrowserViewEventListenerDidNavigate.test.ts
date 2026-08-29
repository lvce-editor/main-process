import { beforeEach, expect, jest, test } from '@jest/globals'

const has = jest.fn<(webContents: object, url: string) => boolean>()
const resolveNetworkFavicon = jest.fn<(favicons: readonly string[]) => Promise<readonly string[]>>()

jest.unstable_mockModule(
  '../src/parts/ElectronBrowserViewEventListenerPageFaviconUpdated/ElectronBrowserViewEventListenerPageFaviconUpdated.ts',
  () => ({ resolveNetworkFavicon }),
)

jest.unstable_mockModule('../src/parts/ElectronBrowserViewFaviconState/ElectronBrowserViewFaviconState.ts', () => ({ has }))

const ElectronBrowserViewEventListenerDidNavigate = await import(
  '../src/parts/ElectronBrowserViewEventListenerDidNavigate/ElectronBrowserViewEventListenerDidNavigate.ts'
)

beforeEach(() => {
  jest.clearAllMocks()
  has.mockReturnValue(false)
  resolveNetworkFavicon.mockResolvedValue(['data:image/x-icon;base64,AAEC'])
})

test('loads the default origin favicon with the navigation', async () => {
  const url = 'https://www.reddit.com/r/javascript/comments/123/post'
  const event = { sender: { getURL: () => url } }

  await expect(ElectronBrowserViewEventListenerDidNavigate.handler(event, url, 200, 'OK', 12)).resolves.toEqual({
    messages: [
      ['handleDidNavigate', url],
      ['handlePageFaviconUpdated', ['data:image/x-icon;base64,AAEC']],
    ],
    result: undefined,
  })

  expect(resolveNetworkFavicon).toHaveBeenCalledWith(['https://www.reddit.com/favicon.ico'])
})

test('does not replace a favicon reported by electron', async () => {
  const url = 'https://example.com/docs'
  const event = { sender: { getURL: () => url } }
  has.mockReturnValue(true)

  await expect(ElectronBrowserViewEventListenerDidNavigate.handler(event, url, 200, 'OK', 12)).resolves.toEqual({
    messages: [['handleDidNavigate', url]],
    result: undefined,
  })
})
