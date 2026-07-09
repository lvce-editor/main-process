import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'

const electronApp = {
  commandLine: {
    appendSwitch: jest.fn(),
  },
  exit: jest.fn(),
  isPackaged: true,
  on: jest.fn(),
  quit: jest.fn(),
  whenReady: jest.fn(),
}

jest.unstable_mockModule('electron', () => {
  return {
    app: electronApp,
  }
})

const ElectronApp = await import('../src/parts/ElectronApp/ElectronApp.ts')
const originalPlatform = process.platform

const setPlatform = (platform: NodeJS.Platform): void => {
  Object.defineProperty(process, 'platform', {
    value: platform,
  })
}

beforeEach(() => {
  setPlatform('linux')
})

afterEach(() => {
  delete process.env.APPIMAGE
  electronApp.isPackaged = true
  setPlatform(originalPlatform)
})

test('isPackagedDeb', () => {
  expect(ElectronApp.isPackagedDeb()).toBe(true)
})

test('isPackagedDeb - not packaged', () => {
  electronApp.isPackaged = false

  expect(ElectronApp.isPackagedDeb()).toBe(false)
})

test('isPackagedDeb - appimage', () => {
  process.env.APPIMAGE = '/test/Lvce.AppImage'

  expect(ElectronApp.isPackagedDeb()).toBe(false)
})

test('isPackagedDeb - windows', () => {
  setPlatform('win32')

  expect(ElectronApp.isPackagedDeb()).toBe(false)
})
