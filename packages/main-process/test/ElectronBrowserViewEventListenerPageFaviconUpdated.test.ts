import { expect, jest, test } from '@jest/globals'
import * as ElectronBrowserViewEventListenerPageFaviconUpdated from '../src/parts/ElectronBrowserViewEventListenerPageFaviconUpdated/ElectronBrowserViewEventListenerPageFaviconUpdated.ts'

test('forwards favicon bytes as a data url', async () => {
  const favicons = ['https://example.com/icon-32.png', 'https://example.com/icon-16.png']
  const fetch = jest.fn<(url: string) => Promise<any>>(async () => ({
    arrayBuffer: async () => Uint8Array.from([0, 1, 2]).buffer,
    headers: {
      get(key: string) {
        return key === 'content-type' ? 'image/png' : '3'
      },
    },
    ok: true,
  }))
  const event = { sender: { getURL: () => 'https://example.com', session: { fetch } } }

  await expect(ElectronBrowserViewEventListenerPageFaviconUpdated.handler(event, favicons)).resolves.toEqual({
    messages: [['handlePageFaviconUpdated', ['data:image/png;base64,AAEC']]],
    result: undefined,
  })
  expect(fetch).toHaveBeenCalledWith('https://example.com/icon-32.png')
})

test('tries the next favicon candidate when the first request fails', async () => {
  const favicons = ['https://example.com/missing.png', 'https://example.com/favicon.ico']
  const fetch = jest
    .fn<(url: string) => Promise<any>>()
    .mockResolvedValueOnce({ ok: false })
    .mockResolvedValueOnce({
      arrayBuffer: async () => Uint8Array.from([3, 4, 5]).buffer,
      headers: { get: () => null },
      ok: true,
    })
  const event = { sender: { getURL: () => 'https://example.com', session: { fetch } } }

  await expect(ElectronBrowserViewEventListenerPageFaviconUpdated.handler(event, favicons)).resolves.toEqual({
    messages: [['handlePageFaviconUpdated', ['data:image/x-icon;base64,AwQF']]],
    result: undefined,
  })
})

test('preserves favicon candidates when they cannot be fetched', async () => {
  const favicons = ['https://example.com/favicon.ico']
  const fetch = jest.fn<(url: string) => Promise<any>>(async () => {
    throw new Error('Failed to fetch')
  })
  const event = { sender: { getURL: () => 'https://example.com', session: { fetch } } }

  await expect(ElectronBrowserViewEventListenerPageFaviconUpdated.handler(event, favicons)).resolves.toEqual({
    messages: [['handlePageFaviconUpdated', favicons]],
    result: undefined,
  })
})

test('does not forward a favicon after the page navigates', async () => {
  let pageUrl = 'https://example.com/one'
  const fetch = jest.fn<(url: string) => Promise<any>>(async () => {
    pageUrl = 'https://example.com/two'
    return {
      arrayBuffer: async () => Uint8Array.from([0, 1, 2]).buffer,
      headers: { get: () => 'image/png' },
      ok: true,
    }
  })
  const event = { sender: { getURL: () => pageUrl, session: { fetch } } }

  await expect(ElectronBrowserViewEventListenerPageFaviconUpdated.handler(event, ['https://example.com/favicon.png'])).resolves.toEqual({
    messages: [],
    result: undefined,
  })
})
