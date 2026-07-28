import { beforeEach, expect, jest, test } from '@jest/globals'
import * as ElectronBrowserViewEventListenerLogin from '../src/parts/ElectronBrowserViewEventListenerLogin/ElectronBrowserViewEventListenerLogin.ts'
import * as ElectronWebContentsViewAuthenticationState from '../src/parts/ElectronWebContentsViewAuthenticationState/ElectronWebContentsViewAuthenticationState.ts'

beforeEach(() => {
  ElectronWebContentsViewAuthenticationState.clear()
})

test('prevents the default login behavior and forwards a serializable challenge', () => {
  const event = {
    preventDefault: jest.fn(),
  }
  const callback = jest.fn()

  const result = ElectronBrowserViewEventListenerLogin.handler(
    event as any,
    {
      url: new URL('https://example.com/private'),
    },
    {
      host: 'example.com',
      isProxy: false,
      port: 443,
      realm: 'Private Area',
      scheme: 'basic',
    },
    callback,
    12,
  )

  expect(event.preventDefault).toHaveBeenCalledTimes(1)
  expect(result).toEqual({
    messages: [
      [
        'handleLogin',
        {
          host: 'example.com',
          isProxy: false,
          port: 443,
          realm: 'Private Area',
          requestId: '12:1',
          scheme: 'basic',
          url: 'https://example.com/private',
        },
      ],
    ],
    result: undefined,
  })
})
