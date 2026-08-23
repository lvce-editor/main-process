import { expect, jest, test } from '@jest/globals'

const mkdirSync = jest.fn()
const setPath = jest.fn()

jest.unstable_mockModule('electron', () => ({
  app: {
    setPath,
  },
}))

jest.unstable_mockModule('node:fs', () => ({
  mkdirSync,
}))

const AppPaths = await import('../src/parts/AppPaths/AppPaths.ts')

test('configures Electron paths', () => {
  AppPaths.configure({
    crashDumpsPath: '/test/config/lvce/electron/Crashpad',
    logsPath: '/test/state/lvce/logs',
    sessionDataPath: '/test/cache/lvce/userdata',
    userDataPath: '/test/config/lvce/electron',
  })

  expect(mkdirSync.mock.calls).toEqual([
    ['/test/config/lvce/electron/Crashpad', { recursive: true }],
    ['/test/state/lvce/logs', { recursive: true }],
    ['/test/cache/lvce/userdata', { recursive: true }],
    ['/test/config/lvce/electron', { recursive: true }],
  ])
  expect(setPath.mock.calls).toEqual([
    ['userData', '/test/config/lvce/electron'],
    ['sessionData', '/test/cache/lvce/userdata'],
    ['crashDumps', '/test/config/lvce/electron/Crashpad'],
    ['logs', '/test/state/lvce/logs'],
  ])
})
