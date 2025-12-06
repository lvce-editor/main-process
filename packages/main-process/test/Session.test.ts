import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
})

afterEach(async () => {
  // @ts-ignore
  ;(await import('../src/parts/ElectronSessionState/ElectronSessionState.js')).set(undefined)
})

test.skip('get', async () => {
  const fakeSession = {
    handle() {},
    protocol: {
      handle() {},
      registerFileProtocol() {},
    },
    setPermissionCheckHandler() {},
    setPermissionRequestHandler() {},
    webRequest: {
      onHeadersReceived() {},
    },
    x: 42,
  }
  jest.unstable_mockModule('electron', () => {
    return {
      session: {
        fromPartition() {
          return fakeSession
        },
      },
    }
  })
  const Session = await import('../src/parts/ElectronSession/ElectronSession.js')
  const ElectronSessionState = await import('../src/parts/ElectronSessionState/ElectronSessionState.js')
  expect(ElectronSessionState.get()).toBeUndefined()
  expect(Session.get()).toBe(fakeSession)
  expect(ElectronSessionState.get()).toBeDefined()
  expect(Session.get()).toBe(fakeSession)
})

test.skip('get - error', async () => {
  jest.unstable_mockModule('electron', () => {
    return {
      session: {
        fromPartition() {
          throw new TypeError('x is not a function')
        },
      },
    }
  })
  const Session = await import('../src/parts/ElectronSession/ElectronSession.js')
  expect(() => {
    Session.get()
  }).toThrow(new TypeError('x is not a function'))
})

test.skip('handlePermissionCheck - allow writing to clipboard', async () => {
  /**
   * @type {any }
   */
  let _permissionCheckHandler
  const fakeSession = {
    protocol: {
      handle() {},
      registerFileProtocol() {},
    },
    setPermissionCheckHandler(fn) {
      _permissionCheckHandler = fn
    },
    setPermissionRequestHandler() {},
    webRequest: {
      onHeadersReceived() {},
    },
    x: 42,
  }
  jest.unstable_mockModule('electron', () => {
    return {
      session: {
        fromPartition() {
          return fakeSession
        },
      },
    }
  })
  const Session = await import('../src/parts/ElectronSession/ElectronSession.js')
  Session.get()
  expect(_permissionCheckHandler({}, 'clipboard-sanitized-write')).toBe(true)
})

test.skip('handlePermissionRequests - allow reading from', async () => {
  /**
   * @type {any }
   */
  let _permissionRequestHandler
  const fakeSession = {
    protocol: {
      handle() {},
      registerFileProtocol() {},
    },
    setPermissionCheckHandler() {},
    setPermissionRequestHandler(fn) {
      _permissionRequestHandler = fn
    },
    webRequest: {
      onHeadersReceived() {},
    },
    x: 42,
  }
  jest.unstable_mockModule('electron', () => {
    return {
      session: {
        fromPartition() {
          return fakeSession
        },
      },
    }
  })
  const Session = await import('../src/parts/ElectronSession/ElectronSession.js')
  Session.get()
  const callback = jest.fn()
  _permissionRequestHandler({}, 'clipboard-sanitized-write', callback)
  expect(callback).toHaveBeenCalledTimes(1)
  expect(callback).toHaveBeenCalledWith(true)
})
