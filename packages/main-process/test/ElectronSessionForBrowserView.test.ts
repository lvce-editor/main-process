import { expect, jest, test } from '@jest/globals'

const on = jest.fn()
const setPermissionCheckHandler = jest.fn()
const setPermissionRequestHandler = jest.fn()
const session = {
  on,
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
