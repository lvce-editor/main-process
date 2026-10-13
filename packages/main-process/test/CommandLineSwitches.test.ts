import { beforeEach, expect, jest, test } from '@jest/globals'

const electronApp = {
  commandLine: {
    appendSwitch: jest.fn(),
    getSwitchValue: jest.fn(() => 'SomeExistingFeature'),
  },
  enableSandbox: jest.fn(),
}

jest.unstable_mockModule('electron', () => {
  return {
    app: electronApp,
  }
})

jest.unstable_mockModule('../src/parts/Platform/Platform.ts', () => {
  return {
    isLinux: true,
  }
})

const CommandLineSwitches = await import('../src/parts/CommandLineSwitches/CommandLineSwitches.ts')
const ParseCliArgs = await import('../src/parts/ParseCliArgs/ParseCliArgs.ts')

beforeEach(() => {
  jest.clearAllMocks()
})

test('enables the Chromium sandbox by default', () => {
  const parsedCliArgs = ParseCliArgs.parseCliArgs(['/usr/lib/lvce/lvce', '/test/'])

  CommandLineSwitches.enable(parsedCliArgs)

  expect(electronApp.enableSandbox).toHaveBeenCalledTimes(1)
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledTimes(1)
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith('lang', 'en')
})

test('disables the GPU sandbox only when no-sandbox is requested', () => {
  const parsedCliArgs = ParseCliArgs.parseCliArgs(['/usr/lib/lvce/lvce', '--no-sandbox', '/test/'])

  CommandLineSwitches.enable(parsedCliArgs)

  expect(electronApp.enableSandbox).not.toHaveBeenCalled()
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledTimes(2)
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith('--disable-gpu-sandbox', undefined)
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith('lang', 'en')
})

test('enables reduced-memory switches and preserves existing disabled features', () => {
  const parsedCliArgs = ParseCliArgs.parseCliArgs(['/usr/lib/lvce/lvce', '/test/'])

  CommandLineSwitches.enable(parsedCliArgs, 'reduce')

  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith('in-process-gpu', undefined)
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith('enable-low-end-device-mode', undefined)
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith(
    'disable-features',
    'SomeExistingFeature,BackForwardCache,SpareRendererForSitePerProcess',
  )
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith('num-raster-threads', '1')
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith('lang', 'en')
})

test('does not add reduced-memory switches in default mode', () => {
  const parsedCliArgs = ParseCliArgs.parseCliArgs(['/usr/lib/lvce/lvce', '/test/'])

  CommandLineSwitches.enable(parsedCliArgs, 'default')

  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledTimes(1)
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith('lang', 'en')
})
