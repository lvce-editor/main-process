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

const ElectronBrowserViewEventListenerDidNavigate =
  await import('../src/parts/ElectronBrowserViewEventListenerDidNavigate/ElectronBrowserViewEventListenerDidNavigate.ts')
const ElectronWebContentsViewState = await import('../src/parts/ElectronWebContentsViewState/ElectronWebContentsViewState.ts')
const WebContentsViewErrorPath = await import('../src/parts/WebContentsViewErrorPath/WebContentsViewErrorPath.ts')

beforeEach(() => {
  jest.clearAllMocks()
  has.mockReturnValue(false)
  resolveNetworkFavicon.mockResolvedValue(['data:image/x-icon;base64,AAEC'])
})

test('sends navigation before loading the default origin favicon', async () => {
  const url = 'https://www.reddit.com/r/javascript/comments/123/post'
  const event = {}
  const webContents = { getURL: () => url }

  expect(ElectronBrowserViewEventListenerDidNavigate.handler(event, url, 200, 'OK', 12, webContents)).toEqual({
    messages: [['handleDidNavigate', url]],
    result: undefined,
  })

  await new Promise((resolve) => setImmediate(resolve))

  expect(send).toHaveBeenCalledWith('ElectronWebContents.handlePageFaviconUpdated', 12, ['data:image/x-icon;base64,AAEC'])
  expect(resolveNetworkFavicon).toHaveBeenCalledWith(['https://www.reddit.com/favicon.ico'])
})

test('does not delay navigation when loading the default favicon fails', async () => {
  const url = 'https://www.reddit.com/r/javascript/comments/123/post'
  const event = {}
  const webContents = { getURL: () => url }
  resolveNetworkFavicon.mockRejectedValueOnce(new Error('Failed to fetch'))

  expect(ElectronBrowserViewEventListenerDidNavigate.handler(event, url, 200, 'OK', 12, webContents)).toEqual({
    messages: [['handleDidNavigate', url]],
    result: undefined,
  })

  await new Promise((resolve) => setImmediate(resolve))
  expect(send).not.toHaveBeenCalled()
})

test('does not send a fallback favicon after navigation', async () => {
  const url = 'https://www.reddit.com/r/javascript/comments/123/post'
  let pageUrl = url
  const event = {}
  const webContents = { getURL: () => pageUrl }
  let resolveFavicon: (favicons: readonly string[]) => void = () => {}
  resolveNetworkFavicon.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveFavicon = resolve
      }),
  )

  expect(ElectronBrowserViewEventListenerDidNavigate.handler(event, url, 200, 'OK', 12, webContents)).toEqual({
    messages: [['handleDidNavigate', url]],
    result: undefined,
  })
  pageUrl = 'https://example.com/other'
  resolveFavicon(['data:image/x-icon;base64,AAEC'])
  await new Promise((resolve) => setImmediate(resolve))

  expect(send).not.toHaveBeenCalled()
})

test('does not replace a favicon reported by electron', async () => {
  const url = 'https://example.com/docs'
  const event = {}
  const webContents = { getURL: () => url }
  has.mockReturnValue(true)

  expect(ElectronBrowserViewEventListenerDidNavigate.handler(event, url, 200, 'OK', 12, webContents)).toEqual({
    messages: [['handleDidNavigate', url]],
    result: undefined,
  })
  await new Promise((resolve) => setImmediate(resolve))
  expect(send).not.toHaveBeenCalled()
})

test('keeps the fallback when electron reports a favicon while it loads', async () => {
  const url = 'https://www.reddit.com/r/javascript/comments/123/post'
  const event = {}
  const webContents = { getURL: () => url }
  let resolveFavicon: (favicons: readonly string[]) => void = () => {}
  resolveNetworkFavicon.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveFavicon = resolve
      }),
  )

  const result = ElectronBrowserViewEventListenerDidNavigate.handler(event, url, 200, 'OK', 12, webContents)
  expect(result).toEqual({
    messages: [['handleDidNavigate', url]],
    result: undefined,
  })
  has.mockReturnValue(true)
  resolveFavicon(['data:image/x-icon;base64,AAEC'])

  await new Promise((resolve) => setImmediate(resolve))
  expect(send).toHaveBeenCalledWith('ElectronWebContents.handlePageFaviconUpdated', 12, ['data:image/x-icon;base64,AAEC'])
  expect(has).toHaveBeenCalledTimes(1)
})

test('reports the failed destination while the error page is displayed', () => {
  const failedNavigationUrl = 'http://localhost:3000/'
  const errorPageUrl = `file://${WebContentsViewErrorPath.webContentsViewErrorPath}?code=ERR_CONNECTION_REFUSED`
  ElectronWebContentsViewState.setFailedNavigationUrl(12, failedNavigationUrl)
  const webContents = { getURL: () => errorPageUrl }

  expect(ElectronBrowserViewEventListenerDidNavigate.handler({}, errorPageUrl, 200, 'OK', 12, webContents)).toEqual({
    messages: [['handleDidNavigate', failedNavigationUrl]],
    result: undefined,
  })
  expect(ElectronWebContentsViewState.getFailedNavigationUrl(12)).toBe(failedNavigationUrl)
})

test('clears a failed destination after a successful retry', () => {
  const failedNavigationUrl = 'http://localhost:3000/'
  ElectronWebContentsViewState.setFailedNavigationUrl(12, failedNavigationUrl)
  const webContents = { getURL: () => failedNavigationUrl }

  expect(ElectronBrowserViewEventListenerDidNavigate.handler({}, failedNavigationUrl, 200, 'OK', 12, webContents)).toEqual({
    messages: [['handleDidNavigate', failedNavigationUrl]],
    result: undefined,
  })
  expect(ElectronWebContentsViewState.getFailedNavigationUrl(12)).toBeUndefined()
})
