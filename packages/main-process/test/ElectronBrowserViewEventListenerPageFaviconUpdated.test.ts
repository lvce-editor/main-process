import { expect, test } from '@jest/globals'
import * as ElectronBrowserViewEventListenerPageFaviconUpdated from '../src/parts/ElectronBrowserViewEventListenerPageFaviconUpdated/ElectronBrowserViewEventListenerPageFaviconUpdated.ts'

test('forwards favicon candidates', () => {
  const favicons = ['https://example.com/icon-32.png', 'https://example.com/icon-16.png']

  expect(ElectronBrowserViewEventListenerPageFaviconUpdated.handler({}, favicons)).toEqual({
    messages: [['handlePageFaviconUpdated', favicons]],
    result: undefined,
  })
})
