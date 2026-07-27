import { beforeEach, expect, jest, test } from '@jest/globals'

const openExternal = jest.fn()

jest.unstable_mockModule('../src/parts/OpenExternal/OpenExternal.ts', () => ({
  openExternal,
}))

const ElectronBrowserViewEventListenerWindowOpen = await import(
  '../src/parts/ElectronBrowserViewEventListenerWindowOpen/ElectronBrowserViewEventListenerWindowOpen.ts'
)

beforeEach(() => {
  jest.resetAllMocks()
})

test.each(['background-tab', 'default', 'foreground-tab', 'new-window'])('blocks %s and opens the url externally', (disposition) => {
  const result = ElectronBrowserViewEventListenerWindowOpen.handler({
    disposition,
    url: 'https://accounts.google.com/o/oauth2/v2/auth',
  })

  expect(result).toEqual({
    messages: [],
    result: {
      action: 'deny',
    },
  })
  expect(openExternal).toHaveBeenCalledTimes(1)
  expect(openExternal).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2/v2/auth')
})

test('blocks about:blank without opening it externally', () => {
  const result = ElectronBrowserViewEventListenerWindowOpen.handler({
    disposition: 'new-window',
    url: 'about:blank',
  })

  expect(result).toEqual({
    messages: [],
    result: {
      action: 'deny',
    },
  })
  expect(openExternal).not.toHaveBeenCalled()
})
