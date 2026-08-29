import { beforeEach, expect, jest, test } from '@jest/globals'

const has = jest.fn<(webContents: object, url: string) => boolean>()
const resolveNetworkFavicon = jest.fn<(favicons: readonly string[]) => Promise<readonly string[]>>()
const send = jest.fn()

jest.unstable_mockModule(
  '../src/parts/ElectronBrowserViewEventListenerPageFaviconUpdated/ElectronBrowserViewEventListenerPageFaviconUpdated.ts',
  () => ({ resolveNetworkFavicon }),
)

jest.unstable_mockModule('../src/parts/ElectronBrowserViewFaviconState/ElectronBrowserViewFaviconState.ts', () => ({ has }))

jest.unstable_mockModule('../src/parts/EmbedsProcess/EmbedsProcess.ts', () => ({ send }))

const ElectronBrowserViewEventListenerDidNavigate = await import(
  '../src/parts/ElectronBrowserViewEventListenerDidNavigate/ElectronBrowserViewEventListenerDidNavigate.ts'
)

beforeEach(() => {
  jest.clearAllMocks()
  has.mockReturnValue(false)
  resolveNetworkFavicon.mockResolvedValue(['data:image/x-icon;base64,AAEC'])
})

test('forwards navigation immediately and loads the default origin favicon', async () => {
  const url = 'https://www.reddit.com/r/javascript/comments/123/post'
  const event = { sender: { getURL: () => url } }

  expect(ElectronBrowserViewEventListenerDidNavigate.handler(event, url, 200, 'OK', 12)).toEqual({
    messages: [['handleDidNavigate', url]],
    result: undefined,
  })
  await Promise.resolve()
  await Promise.resolve()

  expect(resolveNetworkFavicon).toHaveBeenCalledWith(['https://www.reddit.com/favicon.ico'])
  expect(send).toHaveBeenCalledWith('ElectronWebContents.handlePageFaviconUpdated', 12, ['data:image/x-icon;base64,AAEC'])
})

test('does not replace a favicon reported by electron', async () => {
  const url = 'https://example.com/docs'
  const event = { sender: { getURL: () => url } }
  has.mockReturnValue(true)

  ElectronBrowserViewEventListenerDidNavigate.handler(event, url, 200, 'OK', 12)
  await Promise.resolve()
  await Promise.resolve()

  expect(send).not.toHaveBeenCalled()
})
