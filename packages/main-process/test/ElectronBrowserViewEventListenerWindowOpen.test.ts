import { expect, jest, test } from '@jest/globals'

const ElectronBrowserViewEventListenerWindowOpen =
  await import('../src/parts/ElectronBrowserViewEventListenerWindowOpen/ElectronBrowserViewEventListenerWindowOpen.ts')

test.each(['background-tab', 'default', 'foreground-tab', 'new-window'])('creates a child web contents view for %s', (disposition) => {
  const childWebContents = { id: 13 } as Electron.WebContents
  const createWindow = jest.fn<(options: Electron.BrowserWindowConstructorOptions, url: string, disposition: string) => Electron.WebContents>(
    () => childWebContents,
  )
  const result = ElectronBrowserViewEventListenerWindowOpen.handler(
    {
      disposition,
      url: 'https://accounts.google.com/o/oauth2/v2/auth',
    },
    12,
    {} as Electron.WebContents,
    createWindow,
  )

  expect(result.messages).toEqual([])
  expect(result.result.action).toBe('allow')
  expect(result.result.createWindow?.({ webPreferences: {} })).toBe(childWebContents)
  expect(createWindow).toHaveBeenCalledWith({ webPreferences: {} }, 'https://accounts.google.com/o/oauth2/v2/auth', disposition)
})

test('creates an about:blank child so scripts receive a window opener', () => {
  const childWebContents = { id: 13 } as Electron.WebContents
  const createWindow = jest.fn<(options: Electron.BrowserWindowConstructorOptions, url: string, disposition: string) => Electron.WebContents>(
    () => childWebContents,
  )
  const result = ElectronBrowserViewEventListenerWindowOpen.handler(
    {
      disposition: 'new-window',
      url: 'about:blank',
    },
    12,
    {} as Electron.WebContents,
    createWindow,
  )

  expect(result.result.action).toBe('allow')
  expect(result.result.createWindow?.({})).toBe(childWebContents)
  expect(createWindow).toHaveBeenCalledWith({}, 'about:blank', 'new-window')
})

test('blocks unsupported protocols', () => {
  const createWindow = jest.fn<(options: Electron.BrowserWindowConstructorOptions, url: string, disposition: string) => Electron.WebContents>()
  const result = ElectronBrowserViewEventListenerWindowOpen.handler(
    {
      disposition: 'new-window',
      url: 'file:///test.txt',
    },
    12,
    {} as Electron.WebContents,
    createWindow,
  )

  expect(result).toEqual({ messages: [], result: { action: 'deny' } })
  expect(createWindow).not.toHaveBeenCalled()
})
