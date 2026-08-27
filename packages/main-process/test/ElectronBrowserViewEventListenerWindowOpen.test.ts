import { expect, test } from '@jest/globals'

const ElectronBrowserViewEventListenerWindowOpen =
  await import('../src/parts/ElectronBrowserViewEventListenerWindowOpen/ElectronBrowserViewEventListenerWindowOpen.ts')

test.each(['background-tab', 'default', 'foreground-tab', 'new-window'])('blocks %s and forwards the url to the owning view', (disposition) => {
  const result = ElectronBrowserViewEventListenerWindowOpen.handler({
    disposition,
    url: 'https://accounts.google.com/o/oauth2/v2/auth',
  })

  expect(result).toEqual({
    messages: [['handleWindowOpen', 'https://accounts.google.com/o/oauth2/v2/auth', disposition]],
    result: {
      action: 'deny',
    },
  })
})

test('blocks about:blank without forwarding it', () => {
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
})
