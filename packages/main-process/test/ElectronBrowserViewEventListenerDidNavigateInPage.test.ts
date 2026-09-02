import { expect, jest, test } from '@jest/globals'
import * as ElectronBrowserViewEventListenerDidNavigateInPage from '../src/parts/ElectronBrowserViewEventListenerDidNavigateInPage/ElectronBrowserViewEventListenerDidNavigateInPage.ts'

test('listens for in-page navigation', () => {
  const listener = jest.fn()
  const webContents = {
    off: jest.fn(),
    on: jest.fn(),
  }

  ElectronBrowserViewEventListenerDidNavigateInPage.attach(webContents, listener)
  ElectronBrowserViewEventListenerDidNavigateInPage.detach(webContents, listener)

  expect(webContents.on).toHaveBeenCalledWith('did-navigate-in-page', listener)
  expect(webContents.off).toHaveBeenCalledWith('did-navigate-in-page', listener)
})

test('forwards main-frame in-page navigation', () => {
  const url = 'https://www.reddit.com/r/firefox/comments/123/post'

  expect(ElectronBrowserViewEventListenerDidNavigateInPage.handler({}, url, true)).toEqual({
    messages: [['handleDidNavigate', url]],
    result: undefined,
  })
})

test('ignores subframe in-page navigation', () => {
  expect(ElectronBrowserViewEventListenerDidNavigateInPage.handler({}, 'https://example.com/frame', false)).toEqual({
    messages: [],
    result: undefined,
  })
})
