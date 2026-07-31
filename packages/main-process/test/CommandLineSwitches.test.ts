import { beforeEach, expect, jest, test } from '@jest/globals'

const electronApp = {
  commandLine: {
    appendSwitch: jest.fn(),
  },
  enableSandbox: jest.fn(),
}

jest.unstable_mockModule('electron', () => {
  return {
    app: electronApp,
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
