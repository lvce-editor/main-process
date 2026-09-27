import { expect, jest, test } from '@jest/globals'

const send = jest.fn()
const hasWebContents = jest.fn(() => true)

jest.unstable_mockModule('../src/parts/ElectronWebContentsViewIpc/ElectronWebContentsViewIpc.ts', () => ({ send }))
jest.unstable_mockModule('../src/parts/ElectronWebContentsViewState/ElectronWebContentsViewState.ts', () => ({ hasWebContents }))

const on = jest.fn()
const setPermissionCheckHandler = jest.fn()
const setPermissionRequestHandler = jest.fn()
const session = {
  on,
  registerPreloadScript: jest.fn(),
  setPermissionCheckHandler,
  setPermissionRequestHandler,
  webRequest: {
    onBeforeRequest: jest.fn(),
  },
}

jest.unstable_mockModule('electron', () => ({
  session: {
    fromPartition: jest.fn(() => session),
  },
}))

const ElectronSessionForBrowserView = await import('../src/parts/ElectronSessionForBrowserView/ElectronSessionForBrowserView.ts')

test('allows a user-selected directory in an embedded page', () => {
  ElectronSessionForBrowserView.getSession()

  const permissionCheck = setPermissionCheckHandler.mock.calls[0][0] as (...args: any[]) => boolean
  expect(permissionCheck(undefined, 'fileSystem', 'https://example.com', {})).toBe(true)

  const permissionRequest = setPermissionRequestHandler.mock.calls[0][0] as (...args: any[]) => void
  const permissionCallback = jest.fn()
  permissionRequest(undefined, 'fileSystem', permissionCallback, {})
  expect(permissionCallback).toHaveBeenCalledWith(true)

  expect(on).toHaveBeenCalledWith('file-system-access-restricted', expect.any(Function))
  const restrictedAccessHandler = on.mock.calls[0][1] as (...args: any[]) => void
  const restrictedAccessCallback = jest.fn()
  restrictedAccessHandler({}, { isDirectory: true, origin: 'https://example.com', path: '/tmp/example' }, restrictedAccessCallback)
  expect(restrictedAccessCallback).toHaveBeenCalledWith('allow')
})

test('routes download start and successful completion from the owning browser view', () => {
  ElectronSessionForBrowserView.getSession()

  const willDownload = on.mock.calls.find(([eventName]) => eventName === 'will-download')?.[1] as (...args: any[]) => void
  const once = jest.fn()
  const item = { once }
  const webContents = { id: 42 }
  willDownload({}, item, webContents)

  const downloadId = send.mock.calls[0][3]
  expect(send).toHaveBeenCalledWith(42, 'ElectronBrowserView.handleDownloadStateChanged', 42, downloadId, 'started')
  const done = once.mock.calls[0][1] as (...args: any[]) => void
  done({}, 'completed')
  expect(send).toHaveBeenLastCalledWith(42, 'ElectronBrowserView.handleDownloadStateChanged', 42, downloadId, 'completed')
})

test('ignores downloads from web contents that are not registered browser views', () => {
  ElectronSessionForBrowserView.getSession()
  send.mockClear()
  hasWebContents.mockReturnValue(false)
  const willDownload = on.mock.calls.find(([eventName]) => eventName === 'will-download')?.[1] as (...args: any[]) => void
  willDownload({}, { once: jest.fn() }, { id: 99 })
  expect(send).not.toHaveBeenCalled()
  hasWebContents.mockReturnValue(true)
})
